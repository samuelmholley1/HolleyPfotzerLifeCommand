// test-clarification-flow.js
// Quick test to verify clarificationService integration works correctly

const { database } = require('./lib/db');
const { clarificationService } = require('./services/clarificationService');

async function testClarificationFlow() {
  console.log('🧪 Testing clarification service with database integration...');
  
  try {
    // Test data
    const testData = {
      topic: 'Test Communication Topic',
      assumptions: ['We both understand the issue', 'We want to resolve this'],
      workspaceId: 'test-workspace-123',
      proposerId: 'test-user-456'
    };

    console.log('📝 Creating clarification with test data:', testData);

    // Test the proposeConversation method
    const clarification = await clarificationService.proposeConversation(
      database,
      testData
    );

    console.log('✅ Clarification created successfully!');
    console.log('📋 Clarification details:', {
      id: clarification.id,
      topic: clarification.topic,
      status: clarification.status,
      workspaceId: clarification.workspaceId,
      proposerId: clarification.proposerId,
      assumptions: JSON.parse(clarification.assumptions)
    });

    // Test fetching clarifications
    console.log('🔍 Fetching all clarifications for workspace...');
    const allClarifications = await clarificationService.getClarifications(
      database,
      testData.workspaceId
    );
    console.log(`📊 Found ${allClarifications.length} clarifications`);

    // Test fetching pending clarifications
    console.log('⏳ Fetching pending clarifications...');
    const pendingClarifications = await clarificationService.getPendingClarifications(
      database,
      testData.workspaceId
    );
    console.log(`📊 Found ${pendingClarifications.length} pending clarifications`);

    // Test updating status
    console.log('🔄 Testing status update...');
    await clarificationService.updateClarificationStatus(
      database,
      clarification.id,
      'agreed'
    );
    console.log('✅ Status updated successfully!');

    console.log('🎉 All tests passed! The clarification service is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testClarificationFlow()
    .then(() => {
      console.log('✨ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed with error:', error);
      process.exit(1);
    });
}

module.exports = { testClarificationFlow };
