document.addEventListener('DOMContentLoaded', function() {
  console.log('🎯 BoldTake Professional popup loaded');
  
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const status = document.getElementById('status');
  
  // --- Functions ---
  
  function updatePopupStatus(stats) {
    if (stats.isRunning) {
      status.textContent = `Session active: ${stats.successful}/${stats.target} tweets completed.`;
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      status.textContent = `Ready to start. Last session: ${stats.successful}/${stats.target}.`;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }
  
  function sendMessage(type, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url && (tabs[0].url.includes('x.com') || tabs[0].url.includes('twitter.com'))) {
        chrome.tabs.sendMessage(tabs[0].id, {type: type}, function(response) {
          if (chrome.runtime.lastError) {
            status.textContent = 'Error: Refresh X.com page.';
            console.error(chrome.runtime.lastError.message);
          } else if (callback) {
            callback(response);
          }
        });
      } else {
        status.textContent = 'Please go to X.com to use BoldTake.';
      }
    });
  }

  // --- Event Listeners ---
  
  if (startBtn) {
    startBtn.addEventListener('click', function() {
      console.log('🚀 Start button clicked');
      sendMessage('BOLDTAKE_START', () => {
        // Refresh status after action
        sendMessage('GET_SESSION_STATS', (response) => updatePopupStatus(response.stats));
      });
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', function() {
      console.log('🛑 Stop button clicked');
      sendMessage('BOLDTAKE_STOP', () => {
        // Refresh status after action
        sendMessage('GET_SESSION_STATS', (response) => updatePopupStatus(response.stats));
      });
    });
  }
  
  // --- Initialize Popup ---
  
  // Get initial status when popup opens
  sendMessage('GET_SESSION_STATS', (response) => {
    if (response && response.stats) {
      updatePopupStatus(response.stats);
    }
  });
});
