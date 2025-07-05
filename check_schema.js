require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking workspace_members table schema...');
  
  try {
    // Get a sample row to see the actual column structure
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Sample workspace_members row:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('\n📋 Available columns:', Object.keys(data[0]));
    } else {
      console.log('⚠️ No data in workspace_members table');
    }
    
    // Also check profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Profiles error:', profileError.message);
    } else if (profileData && profileData.length > 0) {
      console.log('\n✅ Sample profiles row:');
      console.log(JSON.stringify(profileData[0], null, 2));
      console.log('\n📋 Available columns:', Object.keys(profileData[0]));
    }
    
    // Also check table structure by querying with LIMIT 0 to get column names
    try {
      console.log('\n🔍 Checking table structures...');
      
      // Check workspace_members structure
      const { data: wmStructure, error: wmError } = await supabase
        .from('workspace_members')
        .select('*')
        .limit(0);
      
      if (wmError) {
        console.error('❌ workspace_members structure error:', wmError.message);
      } else {
        console.log('📋 workspace_members table exists (columns unknown from empty result)');
      }
      
      // Check profiles structure  
      const { data: profileStructure, error: profileStructError } = await supabase
        .from('profiles')
        .select('*')
        .limit(0);
      
      if (profileStructError) {
        console.error('❌ profiles structure error:', profileStructError.message);
      } else {
        console.log('📋 profiles table exists (columns unknown from empty result)');
      }
      
      // Try to get user info from auth.users to see available columns
      console.log('\n🔍 Checking current user data for column names...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ Current user object structure:');
        console.log(JSON.stringify(user, null, 2));
      }
      
    } catch (structureError) {
      console.error('❌ Structure check error:', structureError);
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkSchema();
