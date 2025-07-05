#!/usr/bin/env node

/**
 * Database Migration Runner
 * This script applies the workspace RLS fix to your Supabase database
 */

const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFile = path.join(__dirname, 'supabase_fix_workspace_rls_comprehensive.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Supabase configuration from your .env
const SUPABASE_URL = 'https://nztnugncfiauygvywyoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dG51Z25jZmlhdXlndnl3eW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDIwNDIsImV4cCI6MjA2Njg3ODA0Mn0.OawaisMtiGffR-QzYZnFPVv4uVtg7rX_gMUjvODu1W8';

async function runMigration() {
    try {
        console.log('🚀 Starting Workspace RLS Migration...');
        console.log('📊 Project URL:', SUPABASE_URL);
        
        // Split SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'COMMIT');

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (!statement) continue;

            console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}:`);
            console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`);

            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({ 
                        sql: statement + ';'
                    })
                });

                if (response.ok) {
                    console.log('   ✅ Success');
                } else {
                    const error = await response.text();
                    console.log('   ❌ Failed:', error);
                    
                    // Continue with next statement for non-critical errors
                    if (!statement.toLowerCase().includes('drop') && 
                        !statement.toLowerCase().includes('if not exists')) {
                        console.log('   ⚠️  Continuing to next statement...');
                    }
                }
            } catch (err) {
                console.log('   ❌ Error:', err.message);
            }
        }

        console.log('\n🎉 Migration completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Test workspace creation in your app');
        console.log('2. Try creating a new user account');
        console.log('3. Verify RLS policies are working');

    } catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    }
}

// Alternative: Direct SQL execution using Supabase CLI
function printCliInstructions() {
    console.log('\n📚 ALTERNATIVE: Manual SQL Execution');
    console.log('================================');
    console.log('If the automated migration doesn\'t work, you can:');
    console.log('');
    console.log('1. Open Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/nztnugncfiauygvywyoz');
    console.log('');
    console.log('2. Go to SQL Editor');
    console.log('');
    console.log('3. Copy and paste the content from:');
    console.log('   supabase_fix_workspace_rls_comprehensive.sql');
    console.log('');
    console.log('4. Run the script');
    console.log('');
    console.log('🔗 Direct link to SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/nztnugncfiauygvywyoz/sql');
}

// Run migration
console.log('🔧 Workspace RLS Migration Tool');
console.log('===============================');

// For now, let's show the CLI instructions since we need service role key for migrations
printCliInstructions();

console.log('\n💡 The automated script above would work if you have the service role key.');
console.log('   For security, please use the manual method via Supabase Dashboard.');
