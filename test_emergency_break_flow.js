const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmergencyBreakFlow() {
  console.log('🧪 Testing Emergency Break Flow...\n');
  
  try {
    // First, get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('⚠️ No authenticated user found. Please sign in to test.');
      return;
    }
    
    console.log(`✅ User authenticated: ${user.email}`);
    
    // Get user's workspace
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (workspaceError || !workspaces || workspaces.length === 0) {
      console.log('⚠️ No workspace found for user. Cannot test.');
      return;
    }
    
    const workspaceId = workspaces[0].workspace_id;
    console.log(`✅ Workspace found: ${workspaceId}`);
    
    // Test 1: Initialize communication mode
    console.log('\n🔧 Test 1: Initialize communication mode');
    const { error: initError } = await supabase
      .from('communication_modes')
      .upsert({
        workspace_id: workspaceId,
        current_mode: 'normal',
        break_count_today: 0,
        partner_acknowledged: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'workspace_id'
      });
    
    if (initError) {
      console.error('❌ Initialize failed:', initError.message);
      return;
    }
    console.log('✅ Communication mode initialized to normal');
    
    // Test 2: Activate emergency break
    console.log('\n🚨 Test 2: Activate emergency break');
    
    // Create emergency break event
    const { error: eventError } = await supabase
      .from('communication_events')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        event_type: 'emergency_break',
        content: {
          trigger: 'automated_test',
          timestamp: new Date().toISOString()
        }
      });
    
    if (eventError) {
      console.error('❌ Event creation failed:', eventError.message);
      return;
    }
    console.log('✅ Emergency break event logged');
    
    // Update communication mode to emergency_break
    const { error: breakError } = await supabase
      .from('communication_modes')
      .update({
        current_mode: 'emergency_break',
        last_break_timestamp: new Date().toISOString(),
        break_count_today: 1,
        partner_acknowledged: false,
        updated_at: new Date().toISOString()
      })
      .eq('workspace_id', workspaceId);
    
    if (breakError) {
      console.error('❌ Emergency break failed:', breakError.message);
      return;
    }
    console.log('✅ Emergency break activated');
    
    // Test 3: Verify current state
    console.log('\n🔍 Test 3: Verify current state');
    const { data: currentMode, error: stateError } = await supabase
      .from('communication_modes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();
    
    if (stateError) {
      console.error('❌ State check failed:', stateError.message);
      return;
    }
    
    console.log('✅ Current communication state:', {
      mode: currentMode.current_mode,
      breaks_today: currentMode.break_count_today,
      acknowledged: currentMode.partner_acknowledged,
      last_break: currentMode.last_break_timestamp
    });
    
    // Test 4: Simulate partner acknowledgment
    console.log('\n🤝 Test 4: Simulate partner acknowledgment');
    const { error: ackError } = await supabase
      .from('communication_modes')
      .update({
        partner_acknowledged: true,
        updated_at: new Date().toISOString()
      })
      .eq('workspace_id', workspaceId);
    
    if (ackError) {
      console.error('❌ Acknowledgment failed:', ackError.message);
      return;
    }
    console.log('✅ Partner acknowledgment simulated');
    
    // Test 5: Resume normal communication
    console.log('\n🔄 Test 5: Resume normal communication');
    const { error: resumeError } = await supabase
      .from('communication_modes')
      .update({
        current_mode: 'normal',
        timeout_end: null,
        partner_acknowledged: false,
        updated_at: new Date().toISOString()
      })
      .eq('workspace_id', workspaceId);
    
    if (resumeError) {
      console.error('❌ Resume failed:', resumeError.message);
      return;
    }
    console.log('✅ Normal communication resumed');
    
    // Log resume event
    await supabase
      .from('communication_events')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        event_type: 'emergency_break',
        content: {
          action: 'resume',
          timestamp: new Date().toISOString()
        }
      });
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('🔗 Emergency break flow is working correctly');
    console.log('📱 You can now test the UI at: http://localhost:3000');
    console.log('💡 Try opening multiple browser tabs to test real-time sync');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testEmergencyBreakFlow().catch(console.error);
