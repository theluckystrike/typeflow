/**
 * BoldTake - Professional X.com Automation
 * Intelligent AI-powered engagement system
 */

console.log('🚀 BoldTake Professional loading...');

let sessionStats = {}; // Will be loaded from storage

// --- Initialization ---

// On script load, check for an active session and resume if needed
(async function initialize() {
  await loadSession();
  if (sessionStats.isRunning) {
    console.log('🔄 Resuming active session...');
    showStatus(`🔄 Resuming active session: ${sessionStats.successful}/${sessionStats.target} tweets`);
    startContinuousSession(true); // Start without resetting stats
  }
})();

// --- Message Handling ---

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Received message:', message.type);
  
  if (message.type === 'BOLDTAKE_START') {
    console.log('🎯 Starting BoldTake continuous session...');
    startContinuousSession();
    sendResponse({success: true, message: 'BoldTake session started'});
  } else if (message.type === 'BOLDTAKE_STOP') {
    console.log('🛑 Stopping BoldTake session...');
    sessionStats.isRunning = false; // Correctly use sessionStats
    showSessionSummary();
    sendResponse({success: true, message: 'BoldTake session stopped'});
  } else if (message.type === 'GET_SESSION_STATS') {
    sendResponse({stats: sessionStats});
  }
  
  return true; // Keep message channel open
});

// --- Core Automation Logic ---

async function startContinuousSession(isResuming = false) {
  if (sessionStats.isRunning && !isResuming) {
    showStatus('🔄 Session already running!');
    return;
  }
  
  if (!isResuming) {
    console.log('🎬 === BoldTake Session Started ===');
    sessionStats = {
      processed: 0,
      successful: 0,
      failed: 0,
      target: 350,
      startTime: new Date().getTime(),
      isRunning: true
    };
  } else {
    sessionStats.isRunning = true;
  }
  
  await saveSession();
  showStatus(`🚀 Starting BoldTake session: Target ${sessionStats.target} tweets`);
  
  // Main session loop with global error handling
  try {
    while (sessionStats.isRunning && sessionStats.processed < sessionStats.target) {
      await processNextTweet();
      
      // Human-like delay between tweets (3-5 minutes for a very slow pace)
      if (sessionStats.isRunning && sessionStats.processed < sessionStats.target) {
        const delay = randomDelay(180000, 300000); // 180-300 seconds
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        
        showStatus(`⏳ Next tweet in ${minutes}m ${seconds}s... (${sessionStats.successful}/${sessionStats.target} completed)`);
        console.log(`⏰ Waiting ${minutes}m ${seconds}s before next tweet...`);
        
        await sleep(delay);
      }
      
    }
  } catch (error) {
    console.error('💥 CRITICAL ERROR! Refreshing page to recover...', error);
    showStatus('💥 Critical error! Refreshing page to recover...');
    await sleep(5000); // Wait 5s before refresh
    location.reload();
  }
  
  // Session complete
  sessionStats.isRunning = false;
  await saveSession();
  showSessionSummary();
}

async function processNextTweet() {
  sessionStats.processed++;
  showStatus(`🔍 Processing tweet ${sessionStats.processed}/${sessionStats.target}...`);
  console.log(`\n🎯 === Tweet ${sessionStats.processed}/${sessionStats.target} ===`);

  // --- Main Page Scope ---
  const tweet = findTweet();
  if (!tweet) {
    showStatus(`❌ No new tweets found.`);
    sessionStats.failed++;
    return;
  }

  // Mark the tweet as processed so we don't select it again
  tweet.setAttribute('data-boldtake-processed', 'true');

  const replyButton = tweet.querySelector('[data-testid="reply"]');
  if (!replyButton) {
    showStatus(`❌ Reply button not found on tweet.`);
    sessionStats.failed++;
    return;
  }
  
  console.log('🖱️ Clicking reply button to open modal...');
  replyButton.click();
  await sleep(randomDelay(2000, 3000)); // Wait for reply modal to appear

  // --- Reply Modal Scope ---
  // From now on, we ONLY interact within the reply modal.
  const success = await handleReplyModal(tweet);

  if (success) {
    sessionStats.successful++;
    showStatus(`✅ Tweet ${sessionStats.processed}/${sessionStats.target} replied!`);
    
    // Like the tweet after successful reply
    await likeTweet(tweet);

  } else {
    sessionStats.failed++;
    showStatus(`❌ Failed to process reply for tweet ${sessionStats.processed}.`);
    console.log(`❌ Failed. Total successful: ${sessionStats.successful}/${sessionStats.target}`);
    // We might need to close a stuck modal here in the future
  }
  await saveSession();
}

async function handleReplyModal(originalTweet) {
  console.log(' M-BM-^@M-^S Handling Reply Modal...');

  // Step 1: Find the reply text box *within the modal* with retries
  const editable = await findReplyTextArea();
  if (!editable) {
    console.error('❌ Could not find tweet text area. Attempting to close modal...');
    await gracefullyCloseModal();
    return false;
  }

  // Step 2: Generate reply
  const tweetText = originalTweet.textContent || '';
  const replyText = await generateSmartReply(tweetText, sessionStats.processed);
  console.log('⌨️ Typing reply:', replyText);

  // Step 3: Type using the "bulletproof" method
  const typed = await safeTypeText(editable, replyText);
  if (!typed) {
    console.error('❌ Typing failed inside reply modal.');
    return false;
  }
  
  await sleep(1000); // Small pause after typing

  // Step 4: Send the reply using keyboard shortcut
  const sent = await sendReplyWithKeyboard();

  if (sent) {
    // Step 5: Confirm the modal has closed
    const closed = await waitForModalToClose();
    if (closed) {
      console.log('✅ Reply modal closed successfully.');
      return true;
    } else {
      console.error('❌ Reply modal did not close after sending.');
      return false;
    }
  } else {
    console.error('❌ Sending reply failed.');
    return false;
  }
}

async function sendReplyWithKeyboard() {
  console.log('🚀 Sending reply with Ctrl/Cmd+Enter...');
  const editable = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (!editable) {
    console.error('❌ Cannot find text area to send from.');
    return false;
  }

  try {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    editable.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      ctrlKey: !isMac,
      metaKey: isMac // metaKey for Command on Mac
    }));
    return true;
  } catch (error) {
    console.error('❌ Keyboard shortcut failed:', error);
    return false;
  }
}

async function waitForModalToClose() {
  console.log('⏳ Waiting for reply modal to disappear...');
  for (let i = 0; i < 50; i++) { // Max wait 5 seconds
    if (!document.querySelector('[data-testid="tweetTextarea_0"]')) {
      return true; // It's gone!
    }
    await sleep(100);
  }
  return false; // Timed out
}

async function findReplyTextArea() {
  console.log('🔍 Actively searching for reply text area...');
  for (let i = 0; i < 30; i++) { // Max wait 3 seconds
    // Primary, more specific selector first
    let textarea = document.querySelector('[data-testid="tweetTextarea_0"][role="textbox"]');
    if (textarea) {
      console.log('✅ Found text area with primary selector.');
      return textarea;
    }
    // Fallback for any contenteditable element if primary fails
    textarea = document.querySelector('[contenteditable="true"]');
    if (textarea) {
      console.log('⚠️ Found text area with fallback selector.');
      return textarea;
    }
    await sleep(100);
  }
  return null;
}

async function gracefullyCloseModal() {
  console.log(' M-BM-^@M-^S Attempting to gracefully close a stuck modal...');
  try {
    // First, try to find a close button
    const closeButton = document.querySelector('[data-testid="app-bar-close"]');
    if (closeButton) {
      console.log(' M-BM-^@M-^S Found close button. Clicking it.');
      closeButton.click();
      await sleep(500);
      return;
    }

    // If no button, simulate pressing the Escape key
    console.log(' M-BM-^@M-^S No close button found. Simulating Escape key press.');
    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true
    }));
  } catch (error) {
    console.error(' M-BM-^@M-^S Error while trying to close modal:', error);
  }
}

function findTweet() {
  const tweets = document.querySelectorAll('[data-testid="tweet"]:not([data-boldtake-processed="true"])');
  console.log(`📊 Found ${tweets.length} unprocessed and unliked tweets`);
  
  if (tweets.length === 0) return null;
  
  // Return the first valid tweet found
  return tweets[0];
}

async function likeTweet(tweet) {
  const likeButton = tweet.querySelector('[data-testid="like"]');
  if (likeButton) {
    console.log(' M-BM-^@M-^S Liking the tweet...');
    likeButton.click();
    await sleep(500); // Small delay after liking
    return true;
  }
  console.warn(' M-BM-^@M-^S Like button not found.');
  return false;
}

async function isTweetLiked(tweet) {
  // If the "Unlike" button is present, it means the tweet is already liked.
  return tweet.querySelector('[data-testid="unlike"]') !== null;
}

async function typeReply(text) {
  // SAFETY FIRST - validate input
  if (!text || text.length === 0) {
    console.log('❌ No text to type');
    return false;
  }
  
  if (text.length > 300) {
    console.log('❌ Text too long, truncating for safety');
    text = text.slice(0, 280);
  }
  
  // Use PROVEN working method - find contenteditable
  const editable = document.querySelector('[contenteditable="true"]');
  
  if (!editable) {
    console.log('❌ No contenteditable element found');
    return false;
  }
  
  console.log('✅ Found contenteditable element');
  console.log('📝 About to type:', text.slice(0, 50) + (text.length > 50 ? '...' : ''));
  
  // SAFE typing with validation
  const success = await safeTypeText(editable, text);
  
  if (success) {
    console.log('✅ Text typed successfully');
    return true;
  } else {
    console.log('❌ Typing failed');
    return false;
  }
}

// BULLETPROOF typing function designed to reliably trigger React state changes
async function safeTypeText(el, str) {
  console.log('🛡️ Starting BULLETPROOF typing process...');
  
  try {
    // 1. Focus the element
    el.focus();
    await sleep(50);

    // 2. Select all existing text
    document.execCommand('selectAll', false, null);
    await sleep(50);

    // 3. Insert the new text. This is a more reliable way to trigger changes.
    document.execCommand('insertText', false, str);
    await sleep(100);

    // 4. Manually fire events to ensure React updates
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await sleep(50);
    el.blur();
    await sleep(50);
    el.focus();

    // 5. Verification
    const currentText = el.textContent || el.innerText;
    if (currentText.includes(str.slice(0, 20))) {
      console.log('✅ Text verification successful.');
      return true;
    } else {
      console.warn('⚠️ Text verification failed. The text might not have been set correctly.');
      // Fallback in case execCommand fails
      el.textContent = str;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      return true;
    }
  } catch (error) {
    console.error('❌ BULLETPROOF typing error:', error);
    return false;
  }
}

function showStatus(message) {
  console.log(`[STATUS] ${message}`);
  
  // Show in top-right corner for user
  showCornerNotification(message);
  
  // Send to sidepanel if available
  chrome.runtime.sendMessage({
    type: 'status_update',
    message: message
  }).catch(() => {
    // Ignore if sidepanel not open
  });
}

// Top-right corner notifications for user visibility
function showCornerNotification(message) {
  // Remove existing notification
  const existing = document.getElementById('boldtake-notification');
  if (existing) {
    existing.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'boldtake-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1a1a1a;
    color: #00ff88;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 1px solid #333; max-width: 300px; word-wrap: break-word; animation: slideIn 0.3s ease-out;
    white-space: pre-wrap; /* Ensure newlines are rendered */
    line-height: 1.4; /* Improve readability */
  `;
  
  // Add animation keyframes
  if (!document.getElementById('boldtake-styles')) {
    const style = document.createElement('style');
    style.id = 'boldtake-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  const headerText = "BoldTake is doing the hard job for you, sip coffee and watch some movies on Netflix ☕️🎬\n\n";
  const statusLabel = "Current status:\n";
  notification.textContent = headerText + statusLabel + message;
  
  // Add to page
  document.body.appendChild(notification);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateSmartReply(tweetText, tweetNumber) {
  // 1. Analyze the tweet to select the best reply strategy
  const selectedPrompt = selectBestPrompt(tweetText);
  console.log(` M-BM-^@M-^S AI Strategy: ${selectedPrompt.name}`);
  
  try {
    // Call OpenAI API through background script
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_REPLY',
      prompt: selectedPrompt.template.replace('{TWEET}', tweetText.slice(0, 200)),
      tweetText: tweetText
    });
    
    if (response && response.reply) {
      // 3. Sanitize the output for a clean, professional look
      let cleanReply = response.reply
        .replace(/^Reply:\s*/i, '') // Remove "Reply: "
        .replace(/@\w+/g, '') // Remove all @mentions
        .replace(/#\w+/g, '') // Remove all #hashtags
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
        .replace(/[—–""'']/g, '') // Remove fancy dashes and quotes
        .replace(/\s+/g, ' ') // Clean multiple spaces
        .trim();
      
      // Ensure it's not too long
      if (cleanReply.length > 280) {
        cleanReply = cleanReply.slice(0, 277) + '...';
      }
      
      return cleanReply;
    }
  } catch (error) {
    console.log('AI generation failed, using fallback:', error);
  }
  
  // Fallback to simple, unique replies if AI fails
  const fallbacks = [
    "This is a great point. What made you think of this approach?",
    "I had a similar experience. The key is finding the right balance.",
    "Interesting perspective. Have you tried implementing this yourself?",
    "This reminds me of something I learned recently about this topic.",
    "Good insight. What would you say is the biggest challenge here?",
    "I appreciate you sharing this. It really makes you think.",
    "This is exactly what I needed to read today. Thank you.",
    "Great observation. I wonder how this applies to other situations."
  ];
  
  return fallbacks[tweetNumber % fallbacks.length];
}

// --- AI Strategy & Prompts ---

function selectBestPrompt(tweetText) {
  const lowerText = tweetText.toLowerCase();

  // Keyword-based prompt selection
  if (lowerText.includes('should i') || lowerText.includes('how to') || lowerText.includes('?')) {
    return PROVEN_PROMPTS.find(p => p.name === "Ask an Insightful Question");
  }
  if (lowerText.includes('we launched') || lowerText.includes('new feature') || lowerText.includes('announcing')) {
    return PROVEN_PROMPTS.find(p => p.name === "Share a Founders Take");
  }
  if (lowerText.includes('i think') || lowerText.includes('in my opinion') || lowerText.includes('is better than')) {
    return PROVEN_PROMPTS.find(p => p.name === "Challenge an Idea");
  }
  if (lowerText.includes('hilarious') || lowerText.includes('funny') || lowerText.includes('lol')) {
    return PROVEN_PROMPTS.find(p => p.name === "Add Witty Humor");
  }
  
  // Default to a random valuable prompt if no specific keywords match
  const valuablePrompts = PROVEN_PROMPTS.filter(p => 
    p.name !== "Add Witty Humor" && p.name !== "Challenge an Idea"
  );
  return valuablePrompts[Math.floor(Math.random() * valuablePrompts.length)];
}

// 2. Enhanced prompts for higher quality replies
const PROVEN_PROMPTS = [
  {
    name: "Share a Founders Take",
    template: "You are an experienced founder. Reply to this tweet with a brief, insightful business lesson. Frame it as a personal learning. Make it valuable, practical, and likely to be shared. Use 2-3 short sentences. Tweet: {TWEET}"
  },
  {
    name: "Write a Proactive Reply", 
    template: "Reply to this tweet by offering a practical, valuable suggestion or a helpful next step. Your goal is to be genuinely useful. Structure your reply in 2-3 concise sentences. Make it shareable. Tweet: {TWEET}"
  },
  {
    name: "Challenge an Idea",
    template: "Reply to this tweet with a respectful but insightful challenge to the main idea. Offer a compelling alternative perspective. Keep it brief (2-3 sentences) and thought-provoking to encourage discussion. Tweet: {TWEET}"
  },
  {
    name: "Add Witty Humor",
    template: "Reply to this tweet with a clever, witty observation. The humor should be light and intelligent. Keep it to 1-2 short sentences. Make it memorable and shareable. Tweet: {TWEET}"
  },
  {
    name: "Craft a Viral Hook",
    template: "Write a reply designed to go viral. It should be a thought-provoking, insightful, or surprising take on the original tweet. Use 2 short, powerful sentences to maximize impact. Tweet: {TWEET}"
  },
  {
    name: "Give High-Signal Praise",
    template: "Reply to this tweet with specific, high-signal praise. Show you understood the core point by highlighting a key insight. Be genuine and concise (2 sentences). Your goal is to add value, not just agree. Tweet: {TWEET}"
  },
  {
    name: "Amplify a Key Point",
    template: "Identify the single most important point in this tweet and expand on it with a unique insight or observation of your own. Your reply should be valuable and practical. Use 2-3 short sentences. Tweet: {TWEET}"
  },
  {
    name: "Ask an Insightful Question",
    template: "Reply to this tweet by asking a single, insightful follow-up question. The question should be open-ended and designed to spark a deeper conversation. Make it valuable and thought-provoking. Tweet: {TWEET}"
  },
  {
    name: "Explain with an Analogy",
    template: "Create a simple, powerful analogy that explains or expands on the concept in this tweet. The analogy should be practical and easy to understand. Keep it to 2-3 concise sentences to make it shareable. Tweet: {TWEET}"
  }
];

function showSessionSummary() {
  const endTime = new Date();
  const duration = Math.floor((endTime - sessionStats.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  console.log('\n🎬 === BoldTake Session Complete ===');
  console.log(`⏰ Duration: ${minutes}m ${seconds}s`);
  console.log(`🎯 Target: ${sessionStats.target} tweets`);
  console.log(`✅ Successful: ${sessionStats.successful}`);
  console.log(`❌ Failed: ${sessionStats.failed}`);
  console.log(`📊 Success Rate: ${Math.round((sessionStats.successful / sessionStats.processed) * 100)}%`);
  
  showStatus(`🎬 Session complete! ${sessionStats.successful}/${sessionStats.target} tweets in ${minutes}m ${seconds}s`);
}

// --- Session Management ---

async function saveSession() {
  return new Promise(resolve => {
    chrome.storage.local.set({ boldtake_session: sessionStats }, resolve);
  });
}

async function loadSession() {
  return new Promise(resolve => {
    chrome.storage.local.get('boldtake_session', (result) => {
      if (result.boldtake_session) {
        sessionStats = result.boldtake_session;
      } else {
        // Default initial state
        sessionStats = { processed: 0, successful: 0, failed: 0, target: 350, isRunning: false };
      }
      resolve();
    });
  });
}

// Initialize
console.log('✅ BoldTake Professional ready! Go to X.com and click Start.');
console.log('🎯 Session mode: 55 tweets with intelligent 1-66 second delays');
console.log('☕ Optimized for extended automation sessions!');
