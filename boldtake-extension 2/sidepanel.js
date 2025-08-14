// BoldTake Real-time Status System
class BoldTakeStatus {
    constructor() {
        this.statusElement = document.querySelector('.status-indicator');
        this.statusText = document.querySelector('.status-text');
        this.activityFeed = document.querySelector('.activity-feed');
        this.init();
    }

    init() {
        this.updateStatus('ready', 'BoldTake Ready ⚡');
        this.startStatusUpdates();
    }

    updateStatus(type, message) {
        if (this.statusElement) {
            this.statusElement.className = `status-indicator ${type}`;
        }
        if (this.statusText) {
            this.statusText.textContent = message;
        }
        this.addActivity(type, message);
    }

    addActivity(type, message) {
        if (!this.activityFeed) return;
        
        const activity = document.createElement('div');
        activity.className = `activity-item ${type}`;
        activity.innerHTML = `
            <span class="activity-icon">${this.getStatusIcon(type)}</span>
            <span class="activity-message">${message}</span>
            <span class="activity-time">${new Date().toLocaleTimeString()}</span>
        `;
        
        this.activityFeed.insertBefore(activity, this.activityFeed.firstChild);
        
        // Keep only last 10 activities
        while (this.activityFeed.children.length > 10) {
            this.activityFeed.removeChild(this.activityFeed.lastChild);
        }
    }

    getStatusIcon(type) {
        const icons = {
            'ready': '⚡',
            'working': '🚀',
            'analyzing': '🧠',
            'posting': '📝',
            'success': '🎯',
            'error': '❌',
            'paused': '⏸️'
        };
        return icons[type] || '⚡';
    }

    startStatusUpdates() {
        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'status_update') {
                this.updateStatus(message.status, message.message);
            }
        });
    }
}

// Sidepanel Controller for BoldTake
class SidepanelController {
  constructor() {
    this.isRunning = false;
    this.stats = {
      repliesCount: 0,
      successRate: 100,
      avgTime: 0,
      dailyTarget: 500,
      startTime: null,
      totalTime: 0,
      errors: 0
    };
    
    this.settings = {
      minEngagement: 500,
      verifiedOnly: false,
      influencersOnly: false,
      businessAccounts: false,
      activeUsers: false,
      noRetweets: true,
      englishOnly: true,
      noReplies: false,
      originalContent: false,
      targetKeywords: '',
      blacklistKeywords: '',
      responsePersonality: 'professional',
      responseLength: 150,
      askQuestions: true,
      shareExperience: true,
      addValue: true,
      useEmojis: false,
      responseDelay: 110,
      dailyTarget: 500,
      startTime: '09:00',
      endTime: '18:00',
      randomDelay: true,
      typingSimulation: true,
      occasionalLikes: true,
      skipSometimes: false
    };
    
    this.consoleLines = [];
    this.activityItems = [];
    
    this.init();
  }
  
  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.setupCollapsibleSections();
    this.startMessageListener();
    this.updateUI();
    
    // Add initial console messages
    this.addConsoleMessage('info', '🚀 Post Ideas Helper Pro initialized');
    this.addConsoleMessage('success', '✅ All systems operational');
    this.addConsoleMessage('info', '🔍 Waiting for user input...');
    
    // Update status every second
    setInterval(() => this.updateStatus(), 1000);
  }
  
  loadSettings() {
    // Load settings from Chrome storage
    chrome.storage.local.get(this.settings).then(stored => {
      this.settings = { ...this.settings, ...stored };
      this.updateSettingsUI();
    });
  }
  
  saveSettings() {
    chrome.storage.local.set(this.settings);
  }
  
  setupEventListeners() {
    // Start/Stop button
    document.getElementById('startButton').addEventListener('click', () => {
      this.toggleAutomation();
    });
    
    // Settings inputs
    document.getElementById('minEngagement').addEventListener('input', (e) => {
      this.settings.minEngagement = parseInt(e.target.value);
      document.getElementById('minEngagementValue').textContent = `${e.target.value}+ likes`;
      this.saveSettings();
    });
    
    document.getElementById('responseLength').addEventListener('input', (e) => {
      this.settings.responseLength = parseInt(e.target.value);
      document.getElementById('responseLengthValue').textContent = `${e.target.value} characters`;
      this.saveSettings();
    });
    
    document.getElementById('responseDelay').addEventListener('input', (e) => {
      this.settings.responseDelay = parseInt(e.target.value);
      document.getElementById('responseDelayValue').textContent = `${e.target.value} seconds`;
      this.saveSettings();
    });
    
    document.getElementById('dailyTarget').addEventListener('input', (e) => {
      this.settings.dailyTarget = parseInt(e.target.value);
      document.getElementById('dailyTargetValue').textContent = `${e.target.value} replies per day`;
      this.saveSettings();
    });
    
    // All checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.settings[e.target.id] = e.target.checked;
        this.saveSettings();
      });
    });
    
    // All select elements
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      select.addEventListener('change', (e) => {
        this.settings[e.target.id] = e.target.value;
        this.saveSettings();
      });
    });
    
    // Text areas
    document.getElementById('targetKeywords').addEventListener('change', (e) => {
      this.settings.targetKeywords = e.target.value;
      this.saveSettings();
    });
    
    document.getElementById('blacklistKeywords').addEventListener('change', (e) => {
      this.settings.blacklistKeywords = e.target.value;
      this.saveSettings();
    });
    
    // Time inputs
    document.getElementById('startTime').addEventListener('change', (e) => {
      this.settings.startTime = e.target.value;
      this.saveSettings();
    });
    
    document.getElementById('endTime').addEventListener('change', (e) => {
      this.settings.endTime = e.target.value;
      this.saveSettings();
    });
  }
  
  setupCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const section = header.parentElement;
        section.classList.toggle('collapsed');
      });
    });
  }
  
  updateSettingsUI() {
    // Update range inputs
    document.getElementById('minEngagement').value = this.settings.minEngagement;
    document.getElementById('minEngagementValue').textContent = `${this.settings.minEngagement}+ likes`;
    
    document.getElementById('responseLength').value = this.settings.responseLength;
    document.getElementById('responseLengthValue').textContent = `${this.settings.responseLength} characters`;
    
    document.getElementById('responseDelay').value = this.settings.responseDelay;
    document.getElementById('responseDelayValue').textContent = `${this.settings.responseDelay} seconds`;
    
    document.getElementById('dailyTarget').value = this.settings.dailyTarget;
    document.getElementById('dailyTargetValue').textContent = `${this.settings.dailyTarget} replies per day`;
    
    // Update checkboxes
    Object.keys(this.settings).forEach(key => {
      const element = document.getElementById(key);
      if (element && element.type === 'checkbox') {
        element.checked = this.settings[key];
      }
    });
    
    // Update selects
    document.getElementById('responsePersonality').value = this.settings.responsePersonality;
    
    // Update text areas
    document.getElementById('targetKeywords').value = this.settings.targetKeywords;
    document.getElementById('blacklistKeywords').value = this.settings.blacklistKeywords;
    
    // Update time inputs
    document.getElementById('startTime').value = this.settings.startTime;
    document.getElementById('endTime').value = this.settings.endTime;
  }
  
  async toggleAutomation() {
    const button = document.getElementById('startButton');
    
    if (!this.isRunning) {
      // Start automation
      this.isRunning = true;
      this.stats.startTime = Date.now();
      
      button.textContent = '⏹️ Stop Automation';
      button.classList.add('stop');
      
      this.updateStatus('active', 'AI Automation Running');
      this.addConsoleMessage('info', '🚀 Starting automation sequence...');
      this.addActivity('info', '🚀', 'AI automation started');
      
      // Show progress bar
      document.getElementById('progressBar').style.display = 'block';
      document.getElementById('progressText').style.display = 'block';
      
      // Send start message to content script
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'XENGAGER_START',
            settings: this.settings
          });
          this.addConsoleMessage('success', '✅ Automation command sent to content script');
        }
      } catch (error) {
        this.addConsoleMessage('error', `❌ Failed to start: ${error.message}`);
        this.stopAutomation();
      }
      
    } else {
      this.stopAutomation();
    }
  }
  
  stopAutomation() {
    this.isRunning = false;
    const button = document.getElementById('startButton');
    
    button.textContent = '🚀 Start AI Automation';
    button.classList.remove('stop');
    
    this.updateStatus('idle', 'Ready to Start');
    this.addConsoleMessage('warning', '⏹️ Automation stopped by user');
    this.addActivity('warning', '⏹️', 'Automation stopped');
    
    // Hide progress bar
    document.getElementById('progressBar').style.display = 'none';
    document.getElementById('progressText').style.display = 'none';
    
    // Send stop message to content script
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { type: 'XENGAGER_STOP' });
      }
    });
  }
  
  updateStatus(type = 'idle', text = 'Ready to Start') {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusDot.className = `status-dot ${type}`;
    statusText.textContent = text;
  }
  
  updateStats() {
    document.getElementById('repliesCount').textContent = this.stats.repliesCount;
    document.getElementById('successRate').textContent = `${this.stats.successRate}%`;
    document.getElementById('avgTime').textContent = `${this.stats.avgTime}s`;
    document.getElementById('dailyTarget').textContent = this.stats.dailyTarget;
  }
  
  updateProgress(current, total) {
    const percentage = (current / total) * 100;
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = `Reply ${current}/${total} sent!`;
  }
  
  addConsoleMessage(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const consoleLine = {
      type,
      message,
      timestamp
    };
    
    this.consoleLines.push(consoleLine);
    
    // Keep only last 100 messages
    if (this.consoleLines.length > 100) {
      this.consoleLines.shift();
    }
    
    this.updateConsoleDisplay();
  }
  
  updateConsoleDisplay() {
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = this.consoleLines.map(line => 
      `<div class="console-line ${line.type}">
        <span class="console-timestamp">[${line.timestamp}]</span>
        ${line.message}
      </div>`
    ).join('');
    
    // Auto-scroll to bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
  
  addActivity(type, icon, message) {
    const activityItem = {
      type,
      icon,
      message,
      time: 'Just now'
    };
    
    this.activityItems.unshift(activityItem);
    
    // Keep only last 20 activities
    if (this.activityItems.length > 20) {
      this.activityItems.pop();
    }
    
    this.updateActivityDisplay();
  }
  
  updateActivityDisplay() {
    const activityFeed = document.getElementById('activityFeed');
    activityFeed.innerHTML = this.activityItems.map(item => 
      `<div class="activity-item">
        <div class="activity-icon ${item.type}">${item.icon}</div>
        <div class="activity-content">
          <div>${item.message}</div>
          <div class="activity-time">${item.time}</div>
        </div>
      </div>`
    ).join('');
  }
  
  startMessageListener() {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SIDEPANEL_UPDATE') {
        this.handleContentScriptMessage(message);
      }
    });
  }
  
  handleContentScriptMessage(message) {
    const { eventType, data } = message;
    
    switch (eventType) {
      case 'CONSOLE_LOG':
        this.addConsoleMessage(data.type || 'info', data.message);
        break;
        
      case 'ACTIVITY':
        this.addActivity(data.type, data.icon, data.message);
        break;
        
      case 'STATS_UPDATE':
        this.stats = { ...this.stats, ...data };
        this.updateStats();
        break;
        
      case 'PROGRESS_UPDATE':
        this.updateProgress(data.current, data.total);
        break;
        
      case 'STATUS_UPDATE':
        this.updateStatus(data.type, data.message);
        break;
        
      case 'AUTOMATION_STOPPED':
        this.stopAutomation();
        break;
    }
  }
  
  updateUI() {
    this.updateStats();
    this.updateSettingsUI();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.boldTakeStatus = new BoldTakeStatus();
  window.sidepanelController = new SidepanelController();
});

// Handle sidepanel visibility
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Sidepanel became visible, refresh data
    window.sidepanelController?.updateUI();
  }
});
