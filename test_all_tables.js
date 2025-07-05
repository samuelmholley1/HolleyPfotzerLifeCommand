const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllTables() {
  console.log('🧪 Testing All Required Tables...\n');
  
  const tables = [
    'workspaces',
    'workspace_members',
    'profiles',
    'goals',
    'tasks',
    'communication_events',
    'communication_modes', 
    'capacity_status',
    'debug_loops'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      console.log(`🔍 Testing table: ${table}`);
      
      // Test read access
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.error(`❌ ${table}:`, error.message);
        if (error.message.includes('does not exist')) {
          console.log(`💡 Table ${table} needs to be created.`);
          allTablesExist = false;
        }
      } else {
        console.log(`✅ ${table}: Table exists and accessible`);
        if (data && data.length > 0) {
          console.log(`📊 ${table}: Contains ${data.length} record(s)`);
        } else {
          console.log(`📊 ${table}: Table is empty`);
        }
      }
      
      console.log('');
    } catch (err) {
      console.error(`❌ Unexpected error testing ${table}:`, err);
      allTablesExist = false;
    }
  }
  
  if (allTablesExist) {
    console.log('🎉 ALL TABLES EXIST AND ARE ACCESSIBLE!');
    console.log('✅ The application should now work without table-related errors.');
    console.log('🚀 You can test the full Communication Circuit Breaker at: http://localhost:3000');
  } else {
    console.log('⚠️ Some tables are missing. Please run the migration script.');
    console.log('📝 Execute: COMPLETE_MISSING_TABLES_MIGRATION.sql in Supabase');
  }
}

testAllTables().catch(console.error);
