require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickTest() {
  console.log('Quick test of daily briefing function...');
  
  try {
    // Test the function with a dummy UUID
    const dummyUuid = '00000000-0000-0000-0000-000000000000';
    
    console.log('🔍 Testing function with dummy UUID...');
    const { data, error } = await supabase.rpc('get_daily_briefing_members', { 
      p_workspace_id: dummyUuid
    });
    
    if (error) {
      console.log('Function exists but errored:', error.message);
      if (error.message.includes('ambiguous')) {
        console.log('⚠️ The function has a column ambiguity issue that needs to be fixed');
      } else if (error.message.includes('Could not find the function')) {
        console.log('❌ Function does not exist - needs to be created');
      }
    } else {
      console.log('✅ Function works perfectly! Returns:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

quickTest();
