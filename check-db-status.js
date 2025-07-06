#!/usr/bin/env node

/**
 * Database Status Checker
 * This script checks what tables and policies currently exist in your database
 */

const fs = require('fs');

// Read the status check SQL
const statusCheckSQL = `
-- Check existing tables
SELECT 
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = t.table_name AND column_name = 'id'
  ) THEN '✅ Has ID' ELSE '❌ No ID' END as has_id,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = t.table_name AND rowsecurity = true
  ) THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_enabled
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
`;

// Supabase configuration
const SUPABASE_URL = 'https://nztnugncfiauygvywyoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dG51Z25jZmlhdXlndnl3eW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDIwNDIsImV4cCI6MjA2Njg3ODA0Mn0.OawaisMtiGffR-QzYZnFPVv4uVtg7rX_gMUjvODu1W8';

async function checkDatabaseStatus() {
    console.log('🔍 Checking Database Status...');
    console.log('=============================');
    
    try {
        // Try to query the database to check connection
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });

        if (response.ok) {
            console.log('✅ Database connection successful!');
            console.log('📊 Project URL:', SUPABASE_URL);
        } else {
            console.log('❌ Database connection failed:', response.status);
            return;
        }

        // Check specific tables we're interested in
        const tablesToCheck = ['workspaces', 'workspace_members', 'profiles', 'goals', 'projects', 'tasks', 'events'];
        
        console.log('\n📋 Table Status Check:');
        console.log('======================');
        
        for (const table of tablesToCheck) {
            try {
                const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                });

                if (tableResponse.status === 200) {
                    console.log(`✅ ${table} - EXISTS`);
                } else if (tableResponse.status === 406) {
                    console.log(`⚠️  ${table} - EXISTS (RLS may be blocking access)`);
                } else if (tableResponse.status === 404) {
                    console.log(`❌ ${table} - NOT FOUND`);
                } else {
                    console.log(`⚠️  ${table} - Status: ${tableResponse.status}`);
                }
            } catch (err) {
                console.log(`❌ ${table} - Error: ${err.message}`);
            }
        }

        console.log('\n🎯 Recommendations:');
        console.log('==================');
        console.log('Based on your error "relation public.goals does not exist":');
        console.log('1. ✅ Run foundational tables script first');
        console.log('2. ✅ Run workspace RLS fix script');
        console.log('3. ✅ Create goals table');
        console.log('4. ✅ Create projects table');
        console.log('5. ✅ Then run your security fixes');

    } catch (error) {
        console.error('💥 Status check failed:', error.message);
    }
}

// Show current status and next steps
console.log('🚀 Holley-Pfotzer Life Command Database Status');
console.log('==============================================');

checkDatabaseStatus();

console.log('\n📝 Quick Manual Steps:');
console.log('======================');
console.log('1. Open: https://supabase.com/dashboard/project/nztnugncfiauygvywyoz/sql');
console.log('2. Run these scripts IN ORDER:');
console.log('   a) supabase_create_foundational_tables.sql');
console.log('   b) supabase_fix_workspace_rls_comprehensive.sql');
console.log('   c) supabase_create_goals_table.sql');
console.log('   d) supabase_create_projects_table.sql');
console.log('3. Then test your application');

console.log('\n💡 Pro tip: Copy each file content and paste into SQL Editor one by one.');
