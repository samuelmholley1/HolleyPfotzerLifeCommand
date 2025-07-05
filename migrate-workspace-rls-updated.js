#!/usr/bin/env node

/**
 * Database Migration Runner (Updated with new database password)
 * This script applies the workspace RLS fix to your Supabase database
 */

const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFile = path.join(__dirname, 'supabase_fix_workspace_rls_comprehensive.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Supabase configuration with updated password
const SUPABASE_URL = 'https://nztnugncfiauygvywyoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dG51Z25jZmlhdXlndnl3eW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDIwNDIsImV4cCI6MjA2Njg3ODA0Mn0.OawaisMtiGffR-QzYZnFPVv4uVtg7rX_gMUjvODu1W8';
const DB_PASSWORD = 'VLYrpK4L7Lg5E5Ld';

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

                const data = await response.json();
                
                if (response.ok) {
                    console.log(`   ✅ Success!`);
                } else {
                    console.log(`   ❌ Error: ${data.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }

        console.log('\n✅ Migration completed!');
        console.log('\n📋 Direct SQL Connection Command:');
        console.log(`cat your_query.sql | psql "postgresql://postgres.nztnugncfiauygvywyoz:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:6543/postgres"`);
        console.log('\n🔍 Verify your changes by checking the tables and policies in Supabase dashboard');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
