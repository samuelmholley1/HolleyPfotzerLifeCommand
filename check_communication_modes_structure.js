// Check communication_modes table structure
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCommunicationModesStructure() {
    console.log('🔍 Checking communication_modes table structure...\n');
    
    try {
        // Query to get table structure
        const { data, error } = await supabase
            .from('communication_modes')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ Error querying communication_modes:', error.message);
            return;
        }
        
        console.log('✅ communication_modes table structure:');
        if (data && data.length > 0) {
            console.log('📊 Columns found in sample row:');
            Object.keys(data[0]).forEach(column => {
                console.log(`   - ${column}: ${typeof data[0][column]}`);
            });
        } else {
            console.log('📊 Table exists but is empty');
            
            // Try to insert a test row to see what columns are required
            const testInsert = await supabase
                .from('communication_modes')
                .insert({ workspace_id: '00000000-0000-0000-0000-000000000000' })
                .select();
                
            if (testInsert.error) {
                console.log('📝 Error details (reveals column requirements):');
                console.log(testInsert.error.message);
            }
        }
        
    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

checkCommunicationModesStructure();
