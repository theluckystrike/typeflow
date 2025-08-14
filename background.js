// Simple background script for BoldTake MVP
console.log('🔧 BoldTake MVP background script loaded');

// API key for testing (remove for GitHub)
const DEFAULT_API_KEY = '';

// Set API key on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('📦 Extension installed');
  if (DEFAULT_API_KEY) {
    chrome.storage.local.set({ boldtake_apiKey: DEFAULT_API_KEY });
    console.log('🔑 API key set for testing');
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Extension started');
});

// Handle messages if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received:', message.type);
  
  if (message.type === 'GENERATE_REPLY') {
    generateReplyWithOpenAI(message.prompt, message.tweetText)
      .then(reply => sendResponse({success: true, reply: reply}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // Keep message channel open
  }
  
  sendResponse({success: true});
});

async function generateReplyWithOpenAI(prompt, tweetText) {
  try {
    const { boldtake_apiKey } = await chrome.storage.local.get({ boldtake_apiKey: DEFAULT_API_KEY });
    
    if (!boldtake_apiKey) {
      throw new Error('No API key available');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${boldtake_apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that writes natural, human-like social media replies. Never use emojis, fancy punctuation, or generic phrases. Keep replies under 280 characters and make them sound authentic.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: 60,
        temperature: 0.8
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.choices[0]?.message?.content?.trim() || 'Interesting point. Thanks for sharing.';
    
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw error;
  }
}

console.log('✅ Background script ready');
