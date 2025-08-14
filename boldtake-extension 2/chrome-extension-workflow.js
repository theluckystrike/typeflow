// 🔥 CHROME EXTENSION WORKFLOW AUTOMATION INTEGRATION
// Connects the genius workflow system with our Chrome extension development

const WorkflowAutomation = require('./workflow-automation.js');

class ChromeExtensionWorkflow extends WorkflowAutomation {
  constructor() {
    super();
    this.projectType = 'chrome-extension';
    this.extensionFiles = [
      'manifest.json',
      'popup.html',
      'popup.js', 
      'contentScript.js',
      'background.js',
      'options.html',
      'options.js'
    ];
    
    // Initialize with Chrome extension specific tasks
    this.initializeChromeExtensionTasks();
  }

  async initializeChromeExtensionTasks() {
    console.log('🔧 Initializing Chrome Extension workflow tasks...');
    
    // Auto-detect current project state
    const projectState = await this.analyzeProjectState();
    
    // Generate tasks based on current state
    const tasks = await this.generateTasksFromProjectState(projectState);
    
    for (const task of tasks) {
      await this.addTask(task);
    }
    
    console.log(`✅ Initialized ${tasks.length} tasks for Chrome extension development`);
  }

  async analyzeProjectState() {
    console.log('🔍 Analyzing Chrome extension project state...');
    
    const state = {
      manifestValid: await this.checkManifestValidity(),
      popupFunctional: await this.checkPopupFunctionality(),
      contentScriptWorking: await this.checkContentScriptStatus(),
      backgroundServiceWorking: await this.checkBackgroundService(),
      extensionLoadable: await this.checkExtensionLoadability(),
      apiIntegrationStatus: await this.checkAPIIntegration(),
      errorCount: await this.countErrors(),
      testCoverage: await this.assessTestCoverage(),
      performanceIssues: await this.identifyPerformanceIssues(),
      securityConcerns: await this.assessSecurityConcerns()
    };
    
    console.log('📊 Project state analysis:', state);
    return state;
  }

  async generateTasksFromProjectState(state) {
    const tasks = [];
    
    // Critical issues first (highest priority)
    if (!state.extensionLoadable) {
      tasks.push({
        title: 'Fix extension loading issues',
        description: 'Extension cannot be loaded in Chrome - critical blocker',
        type: 'bugfix',
        priority: 10,
        estimatedHours: 2,
        complexity: 'high',
        dependencies: []
      });
    }
    
    if (!state.manifestValid) {
      tasks.push({
        title: 'Fix manifest.json validation errors',
        description: 'Manifest has validation errors preventing proper loading',
        type: 'bugfix', 
        priority: 9,
        estimatedHours: 1,
        complexity: 'medium',
        dependencies: []
      });
    }
    
    // Core functionality issues
    if (!state.contentScriptWorking) {
      tasks.push({
        title: 'Debug content script functionality',
        description: 'Content script is not executing properly on target pages',
        type: 'bugfix',
        priority: 8,
        estimatedHours: 3,
        complexity: 'high',
        dependencies: ['Fix manifest.json validation errors']
      });
    }
    
    if (!state.popupFunctional) {
      tasks.push({
        title: 'Fix popup UI and functionality',
        description: 'Popup interface has issues with user interaction',
        type: 'bugfix',
        priority: 7,
        estimatedHours: 2,
        complexity: 'medium',
        dependencies: []
      });
    }
    
    if (!state.backgroundServiceWorking) {
      tasks.push({
        title: 'Fix background service worker',
        description: 'Background script not handling messages or API calls properly',
        type: 'bugfix',
        priority: 7,
        estimatedHours: 2,
        complexity: 'medium',
        dependencies: []
      });
    }
    
    // API and integration issues
    if (state.apiIntegrationStatus !== 'working') {
      tasks.push({
        title: 'Fix OpenAI API integration',
        description: 'API calls failing or returning errors',
        type: 'integration',
        priority: 6,
        estimatedHours: 3,
        complexity: 'medium',
        dependencies: ['Fix background service worker']
      });
    }
    
    // Performance and optimization
    if (state.performanceIssues.length > 0) {
      for (const issue of state.performanceIssues) {
        tasks.push({
          title: `Optimize ${issue.component}`,
          description: `${issue.description} - impacts user experience`,
          type: 'optimization',
          priority: 4,
          estimatedHours: 2,
          complexity: 'medium',
          dependencies: []
        });
      }
    }
    
    // Security improvements
    if (state.securityConcerns.length > 0) {
      for (const concern of state.securityConcerns) {
        tasks.push({
          title: `Address security concern: ${concern.type}`,
          description: concern.description,
          type: 'security',
          priority: 5,
          estimatedHours: 1,
          complexity: 'low',
          dependencies: []
        });
      }
    }
    
    // Testing and quality assurance
    if (state.testCoverage < 0.5) {
      tasks.push({
        title: 'Improve test coverage',
        description: `Current coverage: ${Math.round(state.testCoverage * 100)}% - add unit tests`,
        type: 'testing',
        priority: 3,
        estimatedHours: 4,
        complexity: 'medium',
        dependencies: []
      });
    }
    
    // Enhancement tasks (if no critical issues)
    if (state.extensionLoadable && state.contentScriptWorking) {
      tasks.push({
        title: 'Add error recovery mechanisms',
        description: 'Implement robust error handling and auto-recovery',
        type: 'enhancement',
        priority: 3,
        estimatedHours: 3,
        complexity: 'medium',
        dependencies: []
      });
      
      tasks.push({
        title: 'Implement user feedback system',
        description: 'Add toast notifications and progress indicators',
        type: 'enhancement',
        priority: 2,
        estimatedHours: 2,
        complexity: 'low',
        dependencies: []
      });
    }
    
    return tasks;
  }

  // Chrome Extension specific task execution methods
  async executeCodeTask(task) {
    console.log(`💻 Executing Chrome extension code task: ${task.title}`);
    
    switch (task.title.toLowerCase()) {
      case 'fix manifest.json validation errors':
        return await this.fixManifestValidation();
      
      case 'debug content script functionality':
        return await this.debugContentScript();
      
      case 'fix popup ui and functionality':
        return await this.fixPopupFunctionality();
      
      case 'fix background service worker':
        return await this.fixBackgroundService();
      
      case 'fix openai api integration':
        return await this.fixAPIIntegration();
      
      default:
        return await this.executeGenericCodeTask(task);
    }
  }

  async fixManifestValidation() {
    console.log('🔧 Fixing manifest.json validation...');
    
    // Read current manifest
    const fs = require('fs');
    const manifestPath = './manifest.json';
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('manifest.json not found');
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Common manifest fixes
    const fixes = [];
    
    // Ensure required fields
    if (!manifest.name) {
      manifest.name = 'Post Ideas Helper';
      fixes.push('Added missing name field');
    }
    
    if (!manifest.version) {
      manifest.version = '1.0.0';
      fixes.push('Added missing version field');
    }
    
    if (!manifest.manifest_version) {
      manifest.manifest_version = 3;
      fixes.push('Added manifest_version 3');
    }
    
    // Fix permissions format
    if (manifest.permissions && !Array.isArray(manifest.permissions)) {
      manifest.permissions = Object.keys(manifest.permissions);
      fixes.push('Fixed permissions format');
    }
    
    // Validate host permissions
    if (manifest.host_permissions) {
      manifest.host_permissions = manifest.host_permissions.filter(url => 
        url.startsWith('http') || url.startsWith('*')
      );
      fixes.push('Cleaned host_permissions');
    }
    
    // Write fixed manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    return {
      success: true,
      fixes: fixes,
      message: `Applied ${fixes.length} manifest fixes`
    };
  }

  async debugContentScript() {
    console.log('🐛 Debugging content script...');
    
    // Check for common content script issues
    const issues = [];
    const fixes = [];
    
    // Read content script file
    const fs = require('fs');
    const contentScriptPath = './contentScript.js';
    
    if (!fs.existsSync(contentScriptPath)) {
      throw new Error('contentScript.js not found');
    }
    
    const content = fs.readFileSync(contentScriptPath, 'utf8');
    
    // Check for syntax errors
    try {
      new Function(content);
    } catch (e) {
      issues.push(`Syntax error: ${e.message}`);
    }
    
    // Check for common issues
    if (!content.includes('chrome.runtime.onMessage')) {
      issues.push('Missing message listener');
      fixes.push('Add chrome.runtime.onMessage listener');
    }
    
    if (content.includes('console.log') && !content.includes('console.error')) {
      fixes.push('Add proper error logging');
    }
    
    if (!content.includes('try') || !content.includes('catch')) {
      fixes.push('Add error handling with try-catch blocks');
    }
    
    return {
      success: issues.length === 0,
      issues: issues,
      suggestedFixes: fixes,
      message: `Found ${issues.length} issues, suggested ${fixes.length} fixes`
    };
  }

  async fixPopupFunctionality() {
    console.log('🔧 Fixing popup functionality...');
    
    const fixes = [];
    
    // Check popup HTML structure
    const fs = require('fs');
    const popupHtmlPath = './popup.html';
    const popupJsPath = './popup.js';
    
    if (fs.existsSync(popupHtmlPath)) {
      const html = fs.readFileSync(popupHtmlPath, 'utf8');
      
      // Check for required elements
      if (!html.includes('id="start"')) {
        fixes.push('Add start button with proper ID');
      }
      
      if (!html.includes('id="status"')) {
        fixes.push('Add status display element');
      }
    }
    
    if (fs.existsSync(popupJsPath)) {
      const js = fs.readFileSync(popupJsPath, 'utf8');
      
      // Check for event listeners
      if (!js.includes('addEventListener')) {
        fixes.push('Add proper event listeners');
      }
      
      // Check for message passing
      if (!js.includes('chrome.tabs.sendMessage')) {
        fixes.push('Add message passing to content script');
      }
    }
    
    return {
      success: true,
      fixes: fixes,
      message: `Identified ${fixes.length} popup improvements`
    };
  }

  // Project state analysis methods
  async checkManifestValidity() {
    try {
      const fs = require('fs');
      const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
      
      // Check required fields
      const required = ['name', 'version', 'manifest_version'];
      return required.every(field => manifest[field]);
    } catch (e) {
      return false;
    }
  }

  async checkPopupFunctionality() {
    const fs = require('fs');
    return fs.existsSync('./popup.html') && fs.existsSync('./popup.js');
  }

  async checkContentScriptStatus() {
    const fs = require('fs');
    if (!fs.existsSync('./contentScript.js')) return false;
    
    const content = fs.readFileSync('./contentScript.js', 'utf8');
    return !content.includes('Uncaught') && content.includes('chrome.runtime');
  }

  async checkBackgroundService() {
    const fs = require('fs');
    return fs.existsSync('./background.js');
  }

  async checkExtensionLoadability() {
    // Check if all required files exist and manifest is valid
    const requiredFiles = ['manifest.json', 'popup.html', 'popup.js', 'contentScript.js'];
    const fs = require('fs');
    
    return requiredFiles.every(file => fs.existsSync(file)) && 
           await this.checkManifestValidity();
  }

  async checkAPIIntegration() {
    const fs = require('fs');
    if (!fs.existsSync('./background.js')) return 'missing';
    
    const content = fs.readFileSync('./background.js', 'utf8');
    if (content.includes('openai') || content.includes('OPENAI')) {
      return 'configured';
    }
    return 'not-configured';
  }

  async countErrors() {
    // Count potential errors in code
    let errorCount = 0;
    const fs = require('fs');
    
    for (const file of this.extensionFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        errorCount += (content.match(/console\.error|throw new|catch/g) || []).length;
      }
    }
    
    return errorCount;
  }

  async assessTestCoverage() {
    // Simple test coverage assessment
    const fs = require('fs');
    const testFiles = ['test', 'spec'].flatMap(type => 
      this.extensionFiles.map(file => file.replace('.js', `.${type}.js`))
    );
    
    const existingTests = testFiles.filter(file => fs.existsSync(file));
    return existingTests.length / this.extensionFiles.length;
  }

  async identifyPerformanceIssues() {
    const issues = [];
    const fs = require('fs');
    
    // Check for potential performance issues
    if (fs.existsSync('./contentScript.js')) {
      const content = fs.readFileSync('./contentScript.js', 'utf8');
      
      if (content.includes('setInterval') && !content.includes('clearInterval')) {
        issues.push({
          component: 'contentScript.js',
          description: 'Potential memory leak - setInterval without clearInterval'
        });
      }
      
      if ((content.match(/querySelector/g) || []).length > 10) {
        issues.push({
          component: 'contentScript.js', 
          description: 'Too many DOM queries - consider caching selectors'
        });
      }
    }
    
    return issues;
  }

  async assessSecurityConcerns() {
    const concerns = [];
    const fs = require('fs');
    
    // Check manifest permissions
    if (fs.existsSync('./manifest.json')) {
      const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
      
      if (manifest.permissions?.includes('<all_urls>')) {
        concerns.push({
          type: 'overprivileged',
          description: 'Extension requests access to all URLs - consider limiting scope'
        });
      }
      
      if (manifest.content_security_policy && 
          typeof manifest.content_security_policy === 'string' &&
          manifest.content_security_policy.includes('unsafe-eval')) {
        concerns.push({
          type: 'csp',
          description: 'Content Security Policy allows unsafe-eval'
        });
      }
    }
    
    return concerns;
  }
}

// 🚀 Auto-start workflow for Chrome extension
async function startChromeExtensionWorkflow() {
  console.log('🚀 Starting Chrome Extension Workflow Automation...');
  
  const workflow = new ChromeExtensionWorkflow();
  
  // Generate initial project report
  const report = workflow.generateExecutionReport();
  console.log('📊 Initial Project Report:', report);
  
  // Start continuous execution
  await workflow.startContinuousExecution();
  
  // Final report
  const finalReport = workflow.generateExecutionReport();
  console.log('🏁 Final Execution Report:', finalReport);
  
  return workflow;
}

// Export the workflow class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChromeExtensionWorkflow, startChromeExtensionWorkflow };
}

console.log('🔥 Chrome Extension Workflow Automation Ready! 🚀');
