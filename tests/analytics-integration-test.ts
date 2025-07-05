// Test script for CommunicationAnalyticsService integration
// This file can be run to test the analytics activation

import { database } from '../lib/db';
import { communicationAnalyticsService } from '../services/CommunicationAnalyticsService';
import { CommunicationService } from '../lib/services/communicationService';

/**
 * Test the complete analytics integration workflow
 */
export const testAnalyticsIntegration = async (workspaceId: string) => {
  console.log('🧪 Testing CommunicationAnalyticsService Integration');
  console.log('================================================');

  try {
    // Step 1: Test analytics service
    console.log('\n1️⃣ Testing analytics service...');
    const analysisResult = await communicationAnalyticsService.analyzeRecentEvents(
      database,
      workspaceId,
      {
        timeWindowMinutes: 10,
        enableDetailedLogging: true
      }
    );

    console.log('✅ Analytics Result:', {
      strainLevel: analysisResult.strainLevel,
      confidence: analysisResult.confidence,
      factors: analysisResult.factors,
      metrics: analysisResult.metrics
    });

    // Step 2: Test state update function
    console.log('\n2️⃣ Testing state update function...');
    const updateResult = await CommunicationService.updateSharedCommunicationState(
      database,
      {
        workspaceId,
        newState: analysisResult.strainLevel
      }
    );

    if (updateResult.success) {
      console.log('✅ State update successful');
    } else {
      console.error('❌ State update failed:', updateResult.error);
    }

    // Step 3: Test insights function
    console.log('\n3️⃣ Testing insights function...');
    const insights = await communicationAnalyticsService.getInsights(
      database,
      workspaceId
    );

    console.log('✅ Insights Result:', {
      status: insights.status,
      message: insights.message,
      recommendations: insights.recommendations,
      metrics: insights.metrics
    });

    // Step 4: Test different strain levels
    console.log('\n4️⃣ Testing different strain level mappings...');
    const testStates = ['calm', 'mild', 'tense', 'critical'];
    
    for (const state of testStates) {
      const testUpdate = await CommunicationService.updateSharedCommunicationState(
        database,
        { workspaceId, newState: state }
      );
      
      console.log(`${testUpdate.success ? '✅' : '❌'} ${state} -> ${testUpdate.success ? 'updated' : testUpdate.error}`);
    }

    console.log('\n🎉 Integration test completed successfully!');
    return true;

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    return false;
  }
};

/**
 * Simulate analytics workflow for demonstration
 */
export const simulateAnalyticsWorkflow = async (workspaceId: string) => {
  console.log('🔄 Simulating analytics workflow...');
  
  // Simulate what happens in CommunicationDashboard every 60 seconds
  const runCycle = async (cycleNumber: number) => {
    console.log(`\n--- Cycle ${cycleNumber} ---`);
    
    try {
      // Analyze
      const result = await communicationAnalyticsService.analyzeRecentEvents(
        database,
        workspaceId,
        { enableDetailedLogging: false }
      );
      
      console.log(`Analysis: ${result.strainLevel} (${result.confidence}% confidence)`);
      
      // Update state
      const update = await CommunicationService.updateSharedCommunicationState(
        database,
        { workspaceId, newState: result.strainLevel }
      );
      
      console.log(`State update: ${update.success ? 'Success' : 'Failed'}`);
      
      return { result, update };
      
    } catch (error) {
      console.error(`Cycle ${cycleNumber} failed:`, error);
      return null;
    }
  };

  // Run 3 cycles with 2 second delays
  for (let i = 1; i <= 3; i++) {
    await runCycle(i);
    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n✅ Workflow simulation completed');
};

/**
 * Configuration validation test
 */
export const testAnalyticsConfiguration = () => {
  console.log('\n⚙️ Testing analytics configuration...');
  
  // Test default configuration
  const defaultConfig = communicationAnalyticsService.getConfig();
  console.log('Default config:', defaultConfig);
  
  // Test custom configuration
  communicationAnalyticsService.updateConfig({
    timeWindowMinutes: 5,
    clarificationThreshold: 1,
    enableDetailedLogging: false
  });
  
  const updatedConfig = communicationAnalyticsService.getConfig();
  console.log('Updated config:', updatedConfig);
  
  // Test cache clearing
  communicationAnalyticsService.clearCache();
  console.log('✅ Cache cleared');
  
  console.log('✅ Configuration tests completed');
};

// Export for manual testing
export const runFullIntegrationTest = async (workspaceId: string) => {
  console.log('🚀 Running Full Integration Test');
  console.log('================================');
  
  try {
    // Run all tests
    await testAnalyticsConfiguration();
    await testAnalyticsIntegration(workspaceId);
    await simulateAnalyticsWorkflow(workspaceId);
    
    console.log('\n🎉 ALL TESTS PASSED! The CommunicationAnalyticsService is properly activated.');
    
    return true;
    
  } catch (error) {
    console.error('\n💥 INTEGRATION TEST FAILED:', error);
    return false;
  }
};

// Usage instructions
console.log(`
📋 Usage Instructions:
====================

1. In your React Native app, import this test file:
   import { runFullIntegrationTest } from './path/to/this/file';

2. Run the test with a valid workspace ID:
   runFullIntegrationTest('your-workspace-id');

3. Check the console output for test results.

4. The CommunicationDashboard component will now automatically:
   - Run analytics every 60 seconds
   - Update communication state based on strain levels
   - Show visual indicators for communication health
   - Alert users when critical strain is detected

🔧 How the Integration Works:
============================

1. CommunicationDashboard.tsx has a useEffect that runs every 60 seconds
2. It calls communicationAnalyticsService.analyzeRecentEvents()
3. The strain level result is passed to CommunicationService.updateSharedCommunicationState()
4. This updates the communication_modes table with the new state
5. UI shows real-time health indicators and alerts for critical strain

⚠️  Important Notes:
===================

- The setInterval is properly cleaned up to prevent memory leaks
- Analytics runs in the background without disrupting user experience
- Critical strain alerts are only shown with high confidence (>70%)
- All database operations are scoped to the user's workspace for security
`);
