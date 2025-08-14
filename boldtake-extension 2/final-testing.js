// 🚀 FINAL COMPREHENSIVE TESTING WITH WORKFLOW AUTOMATION
// Using the genius workflow system to test everything systematically

const fs = require('fs');
const path = require('path');
const WorkflowAutomation = require('./workflow-automation.js');

class FinalTestingWorkflow extends WorkflowAutomation {
  constructor() {
    super();
    this.projectType = 'chrome-extension';
    this.testResults = [];
    this.criticalIssues = [];
    this.warnings = [];
  }

  async runComprehensiveTesting() {
    console.log('🚀 Starting Comprehensive Chrome Extension Testing...\n');
    
    // Initialize testing tasks
    await this.initializeTestingTasks();
    
    // Run continuous testing workflow
    await this.startContinuousExecution();
    
    // Generate final report
    return this.generateFinalReport();
  }

  async initializeTestingTasks() {
    console.log('📋 Initializing comprehensive testing tasks...');
    
    const testTasks = [
      {
        title: 'Validate manifest.json',
        description: 'Check manifest structure, permissions, and required fields',
        type: 'validation',
        priority: 10,
        estimatedHours: 1,
        testFunction: () => this.testManifest()
      },
      {
        title: 'Test content script syntax',
        description: 'Verify content script has no syntax errors',
        type: 'syntax',
        priority: 9,
        estimatedHours: 1,
        testFunction: () => this.testContentScriptSyntax()
      },
      {
        title: 'Test popup functionality',
        description: 'Validate popup HTML and JavaScript',
        type: 'functionality',
        priority: 8,
        estimatedHours: 1,
        testFunction: () => this.testPopupFunctionality()
      },
      {
        title: 'Test background service',
        description: 'Verify background script functionality',
        type: 'functionality',
        priority: 8,
        estimatedHours: 1,
        testFunction: () => this.testBackgroundService()
      },
      {
        title: 'Test API integration',
        description: 'Validate OpenAI API integration',
        type: 'integration',
        priority: 7,
        estimatedHours: 1,
        testFunction: () => this.testAPIIntegration()
      },
      {
        title: 'Test send functionality',
        description: 'Verify triple-redundant send system',
        type: 'functionality',
        priority: 9,
        estimatedHours: 2,
        testFunction: () => this.testSendFunctionality()
      },
      {
        title: 'Performance analysis',
        description: 'Check for performance issues',
        type: 'performance',
        priority: 5,
        estimatedHours: 1,
        testFunction: () => this.performanceAnalysis()
      },
      {
        title: 'Security audit',
        description: 'Check for security vulnerabilities',
        type: 'security',
        priority: 6,
        estimatedHours: 1,
        testFunction: () => this.securityAudit()
      }
    ];

    for (const task of testTasks) {
      await this.addTask(task);
    }

    console.log(`✅ Initialized ${testTasks.length} testing tasks`);
  }

  async executeTask(task) {
    console.log(`⚡ Executing test: ${task.title}`);
    
    try {
      await this.updateTaskStatus(task.id, 'in_progress');
      
      // Execute the test function
      let result;
      if (task.testFunction) {
        result = await task.testFunction();
      } else {
        result = await this.executeGenericTask(task);
      }
      
      // Record test result
      this.testResults.push({
        task: task.title,
        result: result,
        timestamp: new Date().toISOString()
      });
      
      // Categorize issues
      if (!result.success) {
        if (result.severity === 'critical') {
          this.criticalIssues.push({
            task: task.title,
            issue: result.message,
            details: result.details
          });
        } else {
          this.warnings.push({
            task: task.title,
            issue: result.message,
            details: result.details
          });
        }
      }
      
      await this.updateTodoAfterCompletion(task.id, result);
      return result;
      
    } catch (error) {
      console.error(`❌ Test failed: ${task.title}`, error);
      
      const errorResult = {
        success: false,
        severity: 'critical',
        message: error.message,
        details: error.stack
      };
      
      this.criticalIssues.push({
        task: task.title,
        issue: error.message,
        details: error.stack
      });
      
      await this.updateTaskStatus(task.id, 'failed', errorResult);
      return errorResult;
    }
  }

  // Test Implementation Methods
  async testManifest() {
    console.log('🔍 Testing manifest.json...');
    
    try {
      if (!fs.existsSync('./manifest.json')) {
        return {
          success: false,
          severity: 'critical',
          message: 'manifest.json not found',
          details: 'Extension cannot load without manifest.json'
        };
      }
      
      const manifestContent = fs.readFileSync('./manifest.json', 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      const issues = [];
      const requiredFields = ['name', 'version', 'manifest_version'];
      
      for (const field of requiredFields) {
        if (!manifest[field]) {
          issues.push(`Missing required field: ${field}`);
        }
      }
      
      if (manifest.manifest_version !== 3) {
        issues.push('Should use Manifest V3');
      }
      
      if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
        issues.push('Invalid permissions format');
      }
      
      if (!manifest.content_scripts || !Array.isArray(manifest.content_scripts)) {
        issues.push('Missing or invalid content_scripts');
      }
      
      return {
        success: issues.length === 0,
        severity: issues.length > 0 ? 'warning' : 'info',
        message: issues.length === 0 ? 'Manifest valid' : `Found ${issues.length} issues`,
        details: issues,
        data: { manifest: manifest }
      };
      
    } catch (error) {
      return {
        success: false,
        severity: 'critical',
        message: 'Failed to parse manifest.json',
        details: error.message
      };
    }
  }

  async testContentScriptSyntax() {
    console.log('🔍 Testing content script syntax...');
    
    try {
      if (!fs.existsSync('./contentScript.js')) {
        return {
          success: false,
          severity: 'critical',
          message: 'contentScript.js not found'
        };
      }
      
      const content = fs.readFileSync('./contentScript.js', 'utf8');
      
      // Basic syntax check
      try {
        new Function(content);
      } catch (syntaxError) {
        return {
          success: false,
          severity: 'critical',
          message: 'Syntax error in contentScript.js',
          details: syntaxError.message
        };
      }
      
      const issues = [];
      
      // Check for essential functions
      if (!content.includes('chrome.runtime.onMessage')) {
        issues.push('Missing message listener');
      }
      
      if (!content.includes('clickSend')) {
        issues.push('Missing clickSend function');
      }
      
      if (!content.includes('simulateRealUserInput')) {
        issues.push('Missing typing simulation function');
      }
      
      if (!content.includes('runOnceOnCurrentPage')) {
        issues.push('Missing main automation function');
      }
      
      // Check for error handling
      const tryCount = (content.match(/try\s*{/g) || []).length;
      const catchCount = (content.match(/catch\s*\(/g) || []).length;
      
      if (tryCount !== catchCount) {
        issues.push('Mismatched try-catch blocks');
      }
      
      return {
        success: issues.length === 0,
        severity: issues.length > 0 ? 'warning' : 'info',
        message: issues.length === 0 ? 'Content script syntax valid' : `Found ${issues.length} issues`,
        details: issues,
        data: { 
          fileSize: content.length,
          tryBlocks: tryCount,
          catchBlocks: catchCount
        }
      };
      
    } catch (error) {
      return {
        success: false,
        severity: 'critical',
        message: 'Failed to read contentScript.js',
        details: error.message
      };
    }
  }

  async testPopupFunctionality() {
    console.log('🔍 Testing popup functionality...');
    
    const issues = [];
    
    // Test popup.html
    if (!fs.existsSync('./popup.html')) {
      issues.push('popup.html not found');
    } else {
      const html = fs.readFileSync('./popup.html', 'utf8');
      
      if (!html.includes('id="start"')) {
        issues.push('Missing start button in popup.html');
      }
      
      if (!html.includes('id="status"')) {
        issues.push('Missing status element in popup.html');
      }
    }
    
    // Test popup.js
    if (!fs.existsSync('./popup.js')) {
      issues.push('popup.js not found');
    } else {
      const js = fs.readFileSync('./popup.js', 'utf8');
      
      if (!js.includes('chrome.tabs.sendMessage')) {
        issues.push('Missing message passing in popup.js');
      }
      
      if (!js.includes('addEventListener')) {
        issues.push('Missing event listeners in popup.js');
      }
      
      // Syntax check
      try {
        new Function(js);
      } catch (syntaxError) {
        issues.push(`Syntax error in popup.js: ${syntaxError.message}`);
      }
    }
    
    return {
      success: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'Popup functionality valid' : `Found ${issues.length} issues`,
      details: issues
    };
  }

  async testBackgroundService() {
    console.log('🔍 Testing background service...');
    
    const issues = [];
    
    if (!fs.existsSync('./background.js')) {
      return {
        success: false,
        severity: 'critical',
        message: 'background.js not found',
        details: 'Background service worker is required for API calls'
      };
    }
    
    const content = fs.readFileSync('./background.js', 'utf8');
    
    // Syntax check
    try {
      new Function(content);
    } catch (syntaxError) {
      return {
        success: false,
        severity: 'critical',
        message: 'Syntax error in background.js',
        details: syntaxError.message
      };
    }
    
    // Check for essential functionality
    if (!content.includes('chrome.runtime.onMessage')) {
      issues.push('Missing message listener');
    }
    
    if (!content.includes('openai') && !content.includes('OPENAI')) {
      issues.push('Missing OpenAI integration');
    }
    
    return {
      success: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'Background service valid' : `Found ${issues.length} issues`,
      details: issues
    };
  }

  async testAPIIntegration() {
    console.log('🔍 Testing API integration...');
    
    if (!fs.existsSync('./background.js')) {
      return {
        success: false,
        severity: 'critical',
        message: 'Cannot test API integration - background.js missing'
      };
    }
    
    const content = fs.readFileSync('./background.js', 'utf8');
    
    const issues = [];
    
    // Check for OpenAI integration
    if (!content.includes('openai') && !content.includes('OPENAI')) {
      issues.push('OpenAI integration not found');
    }
    
    // Check for API key handling
    if (!content.includes('apiKey') && !content.includes('API_KEY')) {
      issues.push('API key handling not found');
    }
    
    // Check for error handling
    if (!content.includes('catch') || !content.includes('error')) {
      issues.push('Missing API error handling');
    }
    
    return {
      success: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'API integration configured' : `Found ${issues.length} issues`,
      details: issues
    };
  }

  async testSendFunctionality() {
    console.log('🔍 Testing send functionality...');
    
    if (!fs.existsSync('./contentScript.js')) {
      return {
        success: false,
        severity: 'critical',
        message: 'Cannot test send functionality - contentScript.js missing'
      };
    }
    
    const content = fs.readFileSync('./contentScript.js', 'utf8');
    
    const issues = [];
    
    // Check for clickSend function
    if (!content.includes('function clickSend') && !content.includes('clickSend =')) {
      issues.push('clickSend function not found');
    }
    
    // Check for triple-redundant methods
    const sendMethods = [
      'MouseEvent',
      'click()',
      'KeyboardEvent',
      'Cmd+Enter',
      'dispatchEvent'
    ];
    
    const foundMethods = sendMethods.filter(method => content.includes(method));
    
    if (foundMethods.length < 3) {
      issues.push(`Only ${foundMethods.length}/5 send methods found - not triple-redundant`);
    }
    
    // Check for verification
    if (!content.includes('verifySent') && !content.includes('checkSent')) {
      issues.push('Send verification not found');
    }
    
    return {
      success: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'Send functionality robust' : `Found ${issues.length} issues`,
      details: issues,
      data: { sendMethods: foundMethods }
    };
  }

  async performanceAnalysis() {
    console.log('🔍 Performing performance analysis...');
    
    const issues = [];
    
    if (fs.existsSync('./contentScript.js')) {
      const content = fs.readFileSync('./contentScript.js', 'utf8');
      
      // Check for performance issues
      const querySelectorCount = (content.match(/querySelector/g) || []).length;
      if (querySelectorCount > 20) {
        issues.push(`Too many DOM queries (${querySelectorCount}) - consider caching`);
      }
      
      const setIntervalCount = (content.match(/setInterval/g) || []).length;
      const clearIntervalCount = (content.match(/clearInterval/g) || []).length;
      
      if (setIntervalCount > clearIntervalCount) {
        issues.push('Potential memory leak - uncleared intervals');
      }
      
      if (content.length > 50000) {
        issues.push('Large content script file - consider splitting');
      }
    }
    
    return {
      success: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'No performance issues found' : `Found ${issues.length} performance concerns`,
      details: issues
    };
  }

  async securityAudit() {
    console.log('🔍 Performing security audit...');
    
    const issues = [];
    
    if (fs.existsSync('./manifest.json')) {
      const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
      
      // Check permissions
      if (manifest.permissions?.includes('<all_urls>')) {
        issues.push('Overly broad permissions - requests access to all URLs');
      }
      
      if (manifest.permissions?.includes('tabs')) {
        issues.push('Requests tabs permission - ensure necessary');
      }
      
      // Check CSP
      if (manifest.content_security_policy?.includes('unsafe-eval')) {
        issues.push('Content Security Policy allows unsafe-eval');
      }
    }
    
    return {
      success: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'No security issues found' : `Found ${issues.length} security concerns`,
      details: issues
    };
  }

  generateFinalReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.result.success).length;
    const failedTests = totalTests - passedTests;
    
    const report = {
      summary: {
        totalTests: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        criticalIssues: this.criticalIssues.length,
        warnings: this.warnings.length
      },
      testResults: this.testResults,
      criticalIssues: this.criticalIssues,
      warnings: this.warnings,
      recommendation: this.getRecommendation()
    };
    
    console.log('\n🏁 FINAL TEST REPORT');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Tests: ${passedTests}/${totalTests} passed (${report.summary.successRate}%)`);
    console.log(`🚨 Critical Issues: ${this.criticalIssues.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`📋 Recommendation: ${report.recommendation}`);
    console.log('═══════════════════════════════════════');
    
    return report;
  }

  getRecommendation() {
    if (this.criticalIssues.length > 0) {
      return 'CRITICAL ISSUES FOUND - Fix before deployment';
    } else if (this.warnings.length > 5) {
      return 'MULTIPLE WARNINGS - Review and fix recommended';
    } else if (this.warnings.length > 0) {
      return 'MINOR ISSUES - Safe to deploy, consider fixes';
    } else {
      return 'READY FOR PRODUCTION - All tests passed';
    }
  }
}

// Export for use
module.exports = FinalTestingWorkflow;

// Run if executed directly
if (require.main === module) {
  const testing = new FinalTestingWorkflow();
  testing.runComprehensiveTesting()
    .then(report => {
      console.log('\n🎉 Testing complete!');
      if (report.summary.criticalIssues === 0) {
        console.log('✅ Ready for final packaging!');
        process.exit(0);
      } else {
        console.log('❌ Critical issues found - fix before packaging');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Testing failed:', error);
      process.exit(1);
    });
}
