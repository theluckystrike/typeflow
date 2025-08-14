// API key must be set by user in extension options for security
// No default API key provided in source code
const DEFAULT_API_KEY = '';

async function ensureApiKey() {
  try {
    const { boldtake_apiKey } = await chrome.storage.local.get({ boldtake_apiKey: '' });
    if (!boldtake_apiKey && DEFAULT_API_KEY) {
      await chrome.storage.local.set({ boldtake_apiKey: DEFAULT_API_KEY });
    }
  } catch (e) {}
}

ensureApiKey();
chrome.runtime.onInstalled?.addListener?.(() => { ensureApiKey(); });
chrome.runtime.onStartup?.addListener?.(() => { ensureApiKey(); });

async function openaiGenerate({ templateId, selectedText, model, language, tone, style }) {
  const { boldtake_apiKey } = await chrome.storage.local.get({ boldtake_apiKey: '' });
  if (!boldtake_apiKey) {
    throw new Error('Missing OpenAI API key. Set it in options.');
  }

  const system = buildSystemPrompt(templateId);
  const user = buildUserPrompt(templateId, selectedText, { language, tone, style });

  const primaryModel = model || 'gpt-4o-mini';
  const fallbackModel = 'gpt-4o-mini';

  async function call(modelName) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${boldtake_apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        max_tokens: 320
      })
    });
    return res;
  }

  let res = await call(primaryModel);
  if (!res.ok) {
    const text = await res.text();
    // Retry with fallback if model not found/unsupported
    if (/model|not found|unsupported|invalid/i.test(text) || res.status === 404 || res.status === 400) {
      console.warn('Primary model failed, retrying with fallback:', primaryModel, '->', fallbackModel, text);
      res = await call(fallbackModel);
    } else {
      throw new Error(`OpenAI error ${res.status} ${text || 'unknown error'}`);
    }
  }
  if (!res.ok) {
    let text = await res.text();
    throw new Error(`OpenAI error ${res.status} ${text || 'unknown error'}`);
  }
  const json = await res.json();
  let output = json.choices?.[0]?.message?.content?.trim() || '';
  output = postProcess(templateId, output);
  // Optional additional refinement pass if enabled
  const { xengager_refine } = await chrome.storage.local.get({ xengager_refine: true });
  if (xengager_refine) {
    const refinePrompt = `Rewrite the following reply to be clear, coherent, and natural while preserving the required formatting rules: no dashes, colons, semicolons; keep the same number of lines; first person voice when applicable. Output only the rewritten text.\n\nReply:\n${output}`;
    try {
      const refineRes = await call(primaryModel);
      if (refineRes.ok) {
        const refinedJson = await refineRes.json();
        const maybe = refinedJson.choices?.[0]?.message?.content?.trim();
        if (maybe) output = postProcess(templateId, maybe);
      }
    } catch (e) {}
  }
  return output;
}

function buildSystemPrompt(templateId) {
  // Minimal system primer
  return 'You are a precise social media reply generator that follows formatting rules exactly.';
}

function buildUserPrompt(templateId, selectedText, params) {
  const { language = 'English', tone = 'Neutral', style = 'Informal' } = params || {};
  const ctx = `\nConversation Context:\n\n${selectedText}\n\nParameters:\n\nTarget Language: ${language}\nWriting Style: ${style}\nTone Setting: ${tone}\n`;
  switch (String(templateId)) {
    case '1':
      return `${ctx}\n${PROMPTS.indieVoice}`;
    case '2':
      return `${ctx}\n${PROMPTS.sparkReply}`;
    case '3':
      return `${ctx}\n${PROMPTS.counter}`;
    case '4':
      return `${ctx}\n${PROMPTS.riff}`;
    case '5':
      return `${ctx}\n${PROMPTS.viral}`;
    case '6':
      return `${ctx}\n${PROMPTS.shout}`;
    case '7':
      return `${ctx}\n${PROMPTS.signal}`;
    case '8':
      return `${ctx}\n${PROMPTS.inquisitor}`;
    case '9':
      return `${ctx}\n${PROMPTS.reframe}`;
    default:
      return `${ctx}\n${PROMPTS.indieVoice}`;
  }
}

function postProcess(templateId, text) {
  // Enforce forbidden punctuation and line constraints
  let out = text.replace(/[\-—:;]+/g, '');
  out = out.replace(/\s+$/g, '').trim();
  const lines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Apply template-specific line constraints
  switch (String(templateId)) {
    case '1': {
      // Indie Voice: 3 or 4 lines only; keep first 4
      const n = Math.min(4, Math.max(3, lines.length));
      out = lines.slice(0, n).join('\n');
      break;
    }
    case '2':
    case '3': {
      // Spark/Counter: 1,2, or 4 lines; clamp
      const allowed = [1, 2, 4];
      let n = lines.length;
      if (!allowed.includes(n)) n = 2;
      out = lines.slice(0, n).join('\n');
      break;
    }
    case '7': {
      // Signal Boost: exactly two lines
      const l1 = lines[0] || '';
      const l2 = lines[1] || (lines[0] || '');
      out = [l1, l2].join('\n');
      break;
    }
    case '8': {
      // Inquisitor: 1-3 lines only
      const n = Math.min(3, Math.max(1, lines.length));
      out = lines.slice(0, n).join('\n');
      break;
    }
    case '9': {
      // Reframe: 2-4 lines only
      const n = Math.min(4, Math.max(2, lines.length));
      out = lines.slice(0, n).join('\n');
      break;
    }
    default:
      out = lines.join('\n');
  }

  // CRITICAL: Enforce X's 280 character limit
  if (out.length > 280) {
    console.warn(`⚠️ Response too long (${out.length} chars), truncating to 280`);
    
    // Try to truncate intelligently at word boundaries
    let truncated = out.substring(0, 277) + '...';
    
    // If still too long, be more aggressive
    if (truncated.length > 280) {
      truncated = out.substring(0, 275) + '...';
    }
    
    // Final safety check
    if (truncated.length > 280) {
      truncated = truncated.substring(0, 280);
    }
    
    out = truncated;
  }

  // Final cleanup
  out = out.replace(/\s+$/g, '').trim();
  
  // Verify final length
  if (out.length === 0) {
    out = "Great point! Thanks for sharing.";
  }
  
  console.log(`✅ Final response: ${out.length} characters`);
  return out;
}

const PROMPTS = {
  indieVoice: `Generate a direct and opinionated reply to the given context. The process is a sequence of sub-tasks. The final output must be only the generated reply text, with no other commentary.\n\nCRITICAL FORMATTING: This rule is more important than anything else. FORBIDDEN: You must not use any dashes (— or -), colons (:), semicolons (;), or quotation marks around terms or phrases. Never put quotes around any words or phrases. Confirm zero dashes, colons, semicolons, or quotes are used.\n\nCRITICAL LENGTH: X has a strict 280 character limit. Keep your response well under 250 characters to be safe.\n\nWrite in first person I. Choose exactly 3 or 4 lines. Reveal a practical system or simple hack. Use hard line breaks. Output only the reply. Keep it coherent and readable for a general audience.`,
  sparkReply: `Generate a provocative, debate-starting reply. Randomly choose 1, 2, or 4 lines. First person I. No dashes, colons, semicolons, or quotation marks around any terms. CRITICAL: Keep under 250 characters for X's 280 limit. Use hard line breaks. Output only the reply.`,
  counter: `Generate a confident refutation of the core assumption. Randomly choose 1, 2, or 4 lines. First person I. No dashes, colons, semicolons, or quotation marks around any terms. CRITICAL: Keep under 250 characters for X's 280 limit. Use hard line breaks. Output only the reply.`,
  riff: `Act as a witty, context-aware comedian. Create a short, shareable reply using line breaks for timing. No dashes, colons, semicolons, or quotation marks around any terms. CRITICAL: Keep under 250 characters for X's 280 limit. Output only the reply.`,
  viral: `Extract handle and first name if present; craft a viral-optimized reply with hook, body, and engaging question. Start with the handle on its own line. No dashes, colons, semicolons, or quotation marks around any terms. CRITICAL: Keep under 250 characters for X's 280 limit. Use hard line breaks. Output only the reply. Keep it coherent and avoid cringe.`,
  shout: `Write a warm, specific congratulations using Acknowledge, Validate, Amplify. No dashes, colons, semicolons, or quotation marks around any terms. CRITICAL: Keep under 250 characters for X's 280 limit. Use hard line breaks. Output only the reply. Be specific and natural.`,
  signal: `Identify the single most powerful idea. Output exactly two lines: lead-in then signal phrase. No dashes, colons, semicolons, or quotation marks around any terms. CRITICAL: Keep under 250 characters for X's 280 limit. Keep the signal clear and quotable.`,
  inquisitor: `Generate one open-ended question to deepen the conversation. 1 to 3 lines. No dashes, colons, semicolons, or quotation marks around any terms. CRITICAL: Keep under 250 characters for X's 280 limit. Output only the question. Make it thoughtful and useful.`,
  reframe: `Explain the core idea with a creative analogy from a different domain. 2 to 4 lines. No dashes, colons, semicolons, or quotation marks around any terms. CRITICAL: Keep under 250 characters for X's 280 limit. Output only the reply. Ensure the analogy is simple and intuitive.`
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'XENGAGER_OPENAI') {
    openaiGenerate(msg.payload)
      .then(text => sendResponse({ ok: true, text }))
      .catch(err => sendResponse({ ok: false, error: String(err?.message || err) }));
    return true; // async
  } else if (msg?.type === 'XENGAGER_CHOOSE_PROMPT') {
    try {
      const chosen = choosePromptForContext(msg.payload?.text || '');
      sendResponse({ ok: true, templateId: chosen });
    } catch (e) {
      sendResponse({ ok: true, templateId: '1' });
    }
    return true;
  } else if (msg?.type === 'SIDEPANEL_UPDATE') {
    // Forward sidepanel updates to the sidepanel
    chrome.runtime.sendMessage(msg).catch(() => {});
    return false;
  }
});

// Enable sidepanel on extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

function choosePromptForContext(text) {
  const t = text.toLowerCase();
  // Simple heuristics
  if (/launch|shipped|hit|mrr|milestone|sold/.test(t)) return '6'; // shout-out
  if (/question|how|why|what|should|could\s|\?$/.test(t)) return '8'; // inquisitor
  if (/absolute|only|always|never|everyone|nobody|must|wrong/.test(t)) return '3'; // counter
  if (/joke|lol|funny|😂|🤣|meme/.test(t)) return '4'; // riff
  if (/advice|thread|tips|framework|secret|here.s how/.test(t)) return '7'; // signal boost
  if (/nostalgia|hope|frustration|hate|love|dream/.test(t)) return '5'; // viral
  // If the text includes humor markers, prefer riff. If includes achievement markers, prefer shout.
  if (/congrats|proud|we did it|milestone|won/.test(t)) return '6';
  if (/lol|lmao|haha/.test(t)) return '4';
  // default engagement style
  return '1';
}


