require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDailyBriefingFunction() {
  console.log('Testing and fixing daily briefing function...');
  
  try {
    // Test with a real workspace ID to see if we can get data
    console.log('🔍 Fetching a real workspace ID to test with...');
    
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1);
    
    if (workspaceError) {
      console.error('❌ Error fetching workspace:', workspaceError);
      return;
    }
    
    if (workspaces && workspaces.length > 0) {
      const workspaceId = workspaces[0].id;
      console.log('📝 Testing with workspace ID:', workspaceId);
      
      const { data, error } = await supabase.rpc('get_daily_briefing_members', { 
        p_workspace_id: workspaceId
      });
      
      if (error) {
        console.log('❌ Function error:', error.message);
        console.log('📝 This suggests the function exists but has a SQL error');
      } else {
        console.log('✅ Function works! Returned data:');
        console.log(data);
      }
    } else {
      console.log('❌ No workspaces found to test with');
    }
    
  } catch (testError) {
    console.error('❌ Error testing function:', testError);
  }
  
  // Test if function exists by checking pg_proc
  try {
    console.log('\n🔍 Checking if function exists in database...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'get_daily_briefing_members');
    
    if (funcError) {
      console.error('❌ Error checking functions:', funcError);
    } else {
      console.log('📋 Function check result:', functions);
    }
  } catch (error) {
    console.error('❌ Error in function check:', error);
  }
}

fixDailyBriefingFunction();
