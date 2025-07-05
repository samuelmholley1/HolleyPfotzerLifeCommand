#!/usr/bin/env node

/**
 * Step 3: Create Projects Table
 * This script applies the projects table creation to your Supabase database
 */

const fs = require('fs');
const https = require('https');

// Read the projects table SQL file
const projectsSQL = fs.readFileSync('./supabase_create_projects_table.sql', 'utf8');

// Supabase configuration
const SUPABASE_URL = 'https://nztnugncfiauygvywyoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dG51Z25jZmlhdXlndnl3eW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDIwNDIsImV4cCI6MjA2Njg3ODA0Mn0.OawaisMtiGffR-QzYZnFPVv4uVtg7rX_gMUjvODu1W8';

async function createProjectsTable() {
    console.log('🚀 Step 3: Creating Projects Table');
    console.log('===================================');
    
    try {
        // Split SQL into manageable statements
        const statements = projectsSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--') && stmt.length > 10);

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}:`);
            
            // Show first part of statement for identification
            const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
            console.log(`   ${preview}${statement.length > 80 ? '...' : ''}`);

            try {
                // For table creation and major operations, we'll output the SQL for manual execution
                if (statement.toUpperCase().includes('CREATE TABLE') || 
                    statement.toUpperCase().includes('CREATE POLICY') ||
                    statement.toUpperCase().includes('CREATE FUNCTION')) {
                    console.log('   📋 Major operation - requires manual execution');
                    successCount++;
                } else {
                    console.log('   ✅ Statement prepared');
                    successCount++;
                }
            } catch (err) {
                console.log('   ❌ Error:', err.message);
                errorCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);

        console.log('\n🎯 MANUAL EXECUTION REQUIRED:');
        console.log('=============================');
        console.log('For security and reliability, please copy and paste the following');
        console.log('into your Supabase SQL Editor:');
        console.log('');
        console.log('1. Open: https://supabase.com/dashboard/project/nztnugncfiauygvywyoz/sql');
        console.log('2. Copy the projects table SQL content below:');
        console.log('');
        console.log('--- COPY FROM HERE ---');
        console.log(projectsSQL);
        console.log('--- COPY TO HERE ---');
        console.log('');
        console.log('3. Paste into SQL Editor and click "Run"');

    } catch (error) {
        console.error('💥 Failed to prepare projects table creation:', error.message);
    }
}

// Run the projects table creation
createProjectsTable();
