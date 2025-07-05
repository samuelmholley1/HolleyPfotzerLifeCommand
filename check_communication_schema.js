const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key available:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in environment variables');
    console.error('SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    try {
        console.log('🔄 Testing Supabase connection...');
        
        const { data, error } = await supabase
            .from('workspaces')
            .select('id')
            .limit(1);
            
        if (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
        
        console.log('✅ Supabase connection successful');
        return true;
        
    } catch (error) {
        console.error('❌ Connection test error:', error);
        return false;
    }
}

async function checkTablesExist() {
    try {
        console.log('🔄 Checking if communication tables already exist...');
        
        const tables = [
            'communication_events',
            'communication_modes', 
            'capacity_status',
            'debug_loops'
        ];
        
        const results = {};
        
        for (const table of tables) {
            try {
                const { error } = await supabase
                    .from(table)
                    .select('id')
                    .limit(0);
                    
                results[table] = !error;
                console.log(`${results[table] ? '✅' : '❌'} Table ${table}: ${results[table] ? 'exists' : 'not found'}`);
            } catch (err) {
                results[table] = false;
                console.log(`❌ Table ${table}: not found`);
            }
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Error checking tables:', error);
        return {};
    }
}

async function displaySchemaForManualExecution() {
    try {
        console.log('\n📋 MANUAL EXECUTION REQUIRED');
        console.log('==========================================');
        console.log('Since automatic execution may fail, please:');
        console.log('1. Go to https://supabase.com/dashboard/project/nztnugncfiauygvywyoz/sql');
        console.log('2. Copy and paste the following SQL:');
        console.log('==========================================\n');
        
        const schemaPath = path.join(__dirname, 'supabase_communication_circuit_breaker_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log(schema);
        
        console.log('\n==========================================');
        console.log('3. Click "Run" to execute the schema');
        console.log('4. Return here and run this script again to verify');
        console.log('==========================================\n');
        
    } catch (error) {
        console.error('❌ Error reading schema file:', error);
    }
}

async function main() {
    console.log('🚀 Communication Circuit Breaker Schema Deployment\n');
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
        console.log('❌ Cannot proceed without database connection');
        return;
    }
    
    // Check existing tables
    const tableStatus = await checkTablesExist();
    
    const allTablesExist = Object.values(tableStatus).every(exists => exists);
    
    if (allTablesExist) {
        console.log('\n🎉 All communication tables already exist!');
        console.log('✅ Communication Circuit Breaker schema is ready');
        console.log('📝 Next steps:');
        console.log('   1. Update WatermelonDB schema to match new tables');
        console.log('   2. Implement Big Red Button UI component');
        console.log('   3. Wire up communication state management');
    } else {
        console.log('\n⚠️  Some tables are missing. Manual execution required.');
        await displaySchemaForManualExecution();
    }
}

main().catch(console.error);
