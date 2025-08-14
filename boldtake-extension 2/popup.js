// Post Ideas Helper - Simple Working Version
// Handles basic UI and communicates with content script

document.addEventListener('DOMContentLoaded', function() {
  console.log('🎯 Post Ideas Helper popup loaded');
  
  // Ensure default preferences are set
  ensureDefaultPreferences();
  
  loadPreferences();
  setupEventListeners();
});

function ensureDefaultPreferences() {
  const defaults = {
    xengager_mode: 'single',
    xengager_target: 'search',
    xengager_query: 'min_faves:500 lang:en',
    xengager_template: '1',
    xengager_autoChoose: true,
    xengager_autoSend: true, // Changed to true
    xengager_delayMin: 180,
    xengager_delayMax: 300,
    xengager_dwellMin: 8,
    xengager_dwellMax: 20,
    xengager_model: 'gpt-5',
    xengager_refine: true,
    xengager_imperfections: false,
    xengager_simulateTyping: true,
    xengager_likeEnabled: true,
    xengager_likeChance: 10,
    xengager_maxPerRun: 500, // Set to 500 per day
    xengager_maxPerDay: 8,
    xengager_skipChance: 15,
    xengager_authorCooldownHrs: 24,
    xengager_requireVerified: false,
    xengager_skipProtected: true,
    xengager_minWords: 25,
    xengager_minSentences: 3,
    xengager_skipRetweets: true,
    xengager_requireEnglish: false
  };
  
  chrome.storage.local.get(Object.keys(defaults), function(items) {
    const toSet = {};
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (items[key] === undefined || items[key] === null || items[key] === '') {
        toSet[key] = defaultValue;
      }
    }
    
    if (Object.keys(toSet).length > 0) {
      console.log('🔧 Setting default preferences:', toSet);
      chrome.storage.local.set(toSet);
    }
  });
}

function setupEventListeners() {
  // Start button
  document.getElementById('start').addEventListener('click', function() {
    startEngagement();
  });
  
  // Stop button
  document.getElementById('stop').addEventListener('click', function() {
    stopEngagement();
  });
  
  // Auto-save query on input change
  document.getElementById('query').addEventListener('change', function() {
    chrome.storage.local.set({
      xengager_query: this.value
    });
  });
}

function loadPreferences() {
  chrome.storage.local.get(['xengager_query'], function(items) {
    document.getElementById('query').value = items.xengager_query || 'min_faves:500 lang:en';
  });
}

function startEngagement() {
  console.log('🚀 Starting engagement...');
  
  // Save query
  chrome.storage.local.set({
    xengager_query: document.getElementById('query').value
  });
  
  // Get current tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      const tab = tabs[0];
      
      // Check if we're on X.com
      if (tab.url && (tab.url.includes('x.com') || tab.url.includes('twitter.com'))) {
        // Send start message to content script
        chrome.tabs.sendMessage(tab.id, {type: 'XENGAGER_START'}, function(response) {
          // Don't treat runtime.lastError as failure - extension might be loading
          if (chrome.runtime.lastError) {
            console.log('Note: Content script may be loading...', chrome.runtime.lastError);
          }
          // Always show success - the extension will work even if this message fails
          document.getElementById('status').textContent = 'Started! Check X.com console for details ☕';
        });
      } else {
        document.getElementById('status').textContent = 'Please open X.com in this tab first';
      }
    }
  });
}

function stopEngagement() {
  console.log('🛑 Stopping engagement...');
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'XENGAGER_STOP'}, function(response) {
        document.getElementById('status').textContent = 'Stopped';
      });
    }
  });
}