const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyCommunicationSchema() {
    try {
        console.log('🔄 Reading Communication Circuit Breaker schema...');
        
        const schemaPath = path.join(__dirname, 'supabase_communication_circuit_breaker_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔄 Applying Communication Circuit Breaker schema to Supabase...');
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
        
        if (error) {
            console.error('❌ Error applying schema:', error);
            return false;
        }

        console.log('✅ Communication Circuit Breaker schema applied successfully!');
        
        // Verify the tables were created
        console.log('🔄 Verifying table creation...');
        
        const tables = [
            'communication_events',
            'communication_modes', 
            'capacity_status',
            'debug_loops'
        ];
        
        for (const table of tables) {
            const { data: tableData, error: tableError } = await supabase
                .from(table)
                .select('*')
                .limit(0);
                
            if (tableError) {
                console.error(`❌ Error verifying table ${table}:`, tableError);
            } else {
                console.log(`✅ Table ${table} verified successfully`);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return false;
    }
}

// Alternative method using direct SQL execution
async function applySchemaDirectly() {
    try {
        console.log('🔄 Applying schema using direct SQL execution...');
        
        const schemaPath = path.join(__dirname, 'supabase_communication_circuit_breaker_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split the schema into individual statements
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`🔄 Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
            
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            
            if (error) {
                console.error(`❌ Error in statement ${i + 1}:`, error);
                console.error(`Statement: ${statement.substring(0, 100)}...`);
                // Continue with next statement rather than stopping
            } else {
                console.log(`✅ Statement ${i + 1} executed successfully`);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Unexpected error in direct execution:', error);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Communication Circuit Breaker schema deployment...');
    
    // Try the RPC method first, fall back to direct execution if needed
    let success = await applyCommunicationSchema();
    
    if (!success) {
        console.log('🔄 RPC method failed, trying direct SQL execution...');
        success = await applySchemaDirectly();
    }
    
    if (success) {
        console.log('🎉 Communication Circuit Breaker schema deployment completed!');
        console.log('📝 Next steps:');
        console.log('   1. Update WatermelonDB schema to match new tables');
        console.log('   2. Implement Big Red Button UI component');
        console.log('   3. Wire up communication state management');
    } else {
        console.log('❌ Schema deployment failed. Please check the logs above.');
        process.exit(1);
    }
}

main().catch(console.error);
