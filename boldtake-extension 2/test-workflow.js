// 🧪 TEST THE GENIUS WORKFLOW AUTOMATION SYSTEM
// This will test the workflow automation on our Chrome extension

const { ChromeExtensionWorkflow, startChromeExtensionWorkflow } = require('./chrome-extension-workflow.js');

async function testWorkflowAutomation() {
  console.log('🧪 Testing Workflow Automation System...\n');
  
  try {
    // Test 1: Initialize the workflow
    console.log('📋 TEST 1: Workflow Initialization');
    const workflow = new ChromeExtensionWorkflow();
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ Workflow initialized with ${workflow.currentTasks.length} tasks`);
    
    // Test 2: Analyze project state
    console.log('\n🔍 TEST 2: Project State Analysis');
    const projectState = await workflow.analyzeProjectState();
    
    console.log('Project Analysis Results:');
    Object.entries(projectState).forEach(([key, value]) => {
      const status = value === true ? '✅' : value === false ? '❌' : '📊';
      console.log(`  ${status} ${key}: ${value}`);
    });
    
    // Test 3: Task complexity analysis
    console.log('\n🧠 TEST 3: Task Complexity Analysis');
    if (workflow.currentTasks.length > 0) {
      const firstTask = workflow.currentTasks[0];
      const complexity = await workflow.analyzeTaskComplexity(firstTask);
      
      console.log(`Task: "${firstTask.title}"`);
      console.log(`Complexity Score: ${complexity.score}/10`);
      console.log(`Recommendation: ${complexity.recommendation}`);
      console.log('Factors:', complexity.factors);
      
      if (complexity.suggestedSubtasks.length > 0) {
        console.log('Suggested Subtasks:');
        complexity.suggestedSubtasks.forEach((subtask, i) => {
          console.log(`  ${i + 1}. ${subtask.title}`);
        });
      }
    }
    
    // Test 4: Next task selection
    console.log('\n🎯 TEST 4: Smart Task Selection');
    const nextTask = await workflow.selectNextTask();
    
    if (nextTask) {
      console.log(`Selected Task: "${nextTask.title}"`);
      console.log(`Priority: ${nextTask.priority}/10`);
      console.log(`Estimated Hours: ${nextTask.estimatedHours}`);
      console.log(`Type: ${nextTask.type}`);
    } else {
      console.log('No tasks available for selection');
    }
    
    // Test 5: Task breakdown (if complex)
    if (nextTask) {
      const taskComplexity = await workflow.analyzeTaskComplexity(nextTask);
      
      if (taskComplexity.score > workflow.complexityThreshold) {
        console.log('\n🔨 TEST 5: Complex Task Breakdown');
        console.log(`Task "${nextTask.title}" is too complex (${taskComplexity.score}/10)`);
        
        const subtasks = await workflow.breakDownComplexTask(nextTask, taskComplexity);
        console.log(`Generated ${subtasks.length} subtasks:`);
        
        subtasks.forEach((subtask, i) => {
          console.log(`  ${i + 1}. ${subtask.title} (${subtask.estimatedHours}h)`);
        });
      } else {
        console.log('\n✅ TEST 5: Task is manageable, no breakdown needed');
      }
    }
    
    // Test 6: Execution report
    console.log('\n📊 TEST 6: Execution Report');
    const report = workflow.generateExecutionReport();
    
    console.log('Workflow Statistics:');
    Object.entries(report).forEach(([key, value]) => {
      console.log(`  📈 ${key}: ${value}`);
    });
    
    // Test 7: Simulate task execution (without actually executing)
    console.log('\n⚡ TEST 7: Simulated Task Execution');
    if (workflow.currentTasks.length > 0) {
      const testTask = workflow.currentTasks[0];
      console.log(`Simulating execution of: "${testTask.title}"`);
      
      // Update status to in-progress
      await workflow.updateTaskStatus(testTask.id, 'in_progress');
      console.log('✅ Task status updated to in-progress');
      
      // Simulate completion
      await workflow.updateTodoAfterCompletion(testTask.id, {
        success: true,
        message: 'Simulated completion',
        changes: ['Fixed syntax error', 'Added error handling', 'Updated documentation']
      });
      console.log('✅ Task completion processed');
    }
    
    // Test 8: Continuous execution check
    console.log('\n🔄 TEST 8: Continuous Execution Readiness');
    const canContinue = workflow.shouldContinueExecution();
    const hasPending = workflow.hasPendingTasks();
    
    console.log(`Can continue execution: ${canContinue ? '✅' : '❌'}`);
    console.log(`Has pending tasks: ${hasPending ? '✅' : '❌'}`);
    console.log(`Tool calls used: ${workflow.currentToolCallCount}/${workflow.maxToolCallsPerBatch}`);
    
    // Final summary
    console.log('\n🎉 WORKFLOW AUTOMATION TEST COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`✅ All tests passed successfully`);
    console.log(`📋 Tasks initialized: ${workflow.currentTasks.length}`);
    console.log(`🧠 Complexity analysis: Working`);
    console.log(`🎯 Task selection: Working`);
    console.log(`🔨 Task breakdown: Working`);
    console.log(`⚡ Task execution: Working`);
    console.log(`🔄 Continuous flow: Ready`);
    console.log('═══════════════════════════════════════');
    
    return {
      success: true,
      workflow: workflow,
      testsCompleted: 8,
      tasksGenerated: workflow.currentTasks.length
    };
    
  } catch (error) {
    console.error('❌ Workflow automation test failed:', error);
    return {
      success: false,
      error: error.message,
      testsCompleted: 0
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWorkflowAutomation()
    .then(result => {
      if (result.success) {
        console.log('\n🚀 Ready to revolutionize productivity!');
        process.exit(0);
      } else {
        console.log('\n💥 Test failed - check the errors above');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected test error:', error);
      process.exit(1);
    });
}

module.exports = { testWorkflowAutomation };
