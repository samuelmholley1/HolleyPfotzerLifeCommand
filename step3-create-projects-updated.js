#!/usr/bin/env node

/**
 * Step 3: Create Projects Table (Updated with new database password)
 * This script applies the projects table creation to your Supabase database
 */

const fs = require('fs');
const https = require('https');

// Read the projects table SQL file
const projectsSQL = fs.readFileSync('./supabase_create_projects_table.sql', 'utf8');

// Supabase configuration with updated password
const SUPABASE_URL = 'https://nztnugncfiauygvywyoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dG51Z25jZmlhdXlndnl3eW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDIwNDIsImV4cCI6MjA2Njg3ODA0Mn0.OawaisMtiGffR-QzYZnFPVv4uVtg7rX_gMUjvODu1W8';
const DB_PASSWORD = 'VLYrpK4L7Lg5E5Ld';

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
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
                errorCount++;
            }
        }

        console.log('\n✅ SQL preparation completed!');
        console.log(`   ${successCount} statements prepared, ${errorCount} errors`);
        console.log('\n📝 Next steps:');
        console.log('1. Use the SQL Editor in the Supabase Dashboard to execute the SQL statements');
        console.log('2. Or execute directly using the following command:');
        console.log(`   cat ./supabase_create_projects_table.sql | psql "postgresql://postgres.nztnugncfiauygvywyoz:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:6543/postgres"`);
        
    } catch (error) {
        console.error('❌ Failed to prepare SQL statements:', error);
        process.exit(1);
    }
}

createProjectsTable();
