const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCommunicationTables() {
  console.log('🧪 Testing Communication Circuit Breaker Tables...\n');
  
  const tables = [
    'communication_events',
    'communication_modes', 
    'capacity_status',
    'debug_loops'
  ];
  
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
          console.log(`💡 Table ${table} needs to be created. Please run the SQL schema.`);
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
    }
  }
  
  // Test creating a sample communication mode record
  console.log('🧪 Testing communication_modes insert...');
  try {
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1);
    
    if (workspaceError || !workspaces || workspaces.length === 0) {
      console.log('⚠️ No workspaces found, skipping insert test');
    } else {
      const workspaceId = workspaces[0].id;
      
      // Try to upsert a communication mode
      const { error: insertError } = await supabase
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
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError.message);
      } else {
        console.log('✅ Insert test successful');
        
        // Clean up test record
        await supabase
          .from('communication_modes')
          .delete()
          .eq('workspace_id', workspaceId);
        console.log('🧹 Test record cleaned up');
      }
    }
  } catch (error) {
    console.error('❌ Insert test error:', error);
  }
  
  console.log('\n🎯 Summary:');
  console.log('If any tables show "does not exist", please:');
  console.log('1. Go to https://supabase.com/dashboard/project/nztnugncfiauygvywyoz/sql');
  console.log('2. Copy and paste the SQL from: supabase_communication_circuit_breaker_schema.sql');
  console.log('3. Run the SQL to create the tables');
  console.log('4. Run this test again to verify');
}

testCommunicationTables().catch(console.error);
