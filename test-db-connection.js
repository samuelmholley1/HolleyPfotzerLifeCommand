#!/usr/bin/env node

/**
 * Database Connection Tester
 * This script verifies connectivity with the new database password
 */

const { exec } = require('child_process');

// Database configuration with the new password
const DB_PASSWORD = 'VLYrpK4L7Lg5E5Ld';
const DB_CONNECTION_STRING = `postgresql://postgres.nztnugncfiauygvywyoz:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

console.log('🔍 Testing Database Connection with New Password...');
console.log('================================================');

// Create a simple test query
const testQuery = 'SELECT current_database() as db_name, current_user as user_name, version();';

// Create a temporary SQL file
const fs = require('fs');
const os = require('os');
const path = require('path');
const tempFilePath = path.join(os.tmpdir(), 'db-test-query.sql');

fs.writeFileSync(tempFilePath, testQuery);

console.log('📝 Test query prepared:', testQuery);

// Execute the query using psql
const command = `cat ${tempFilePath} | psql "${DB_CONNECTION_STRING}"`;
console.log(`🚀 Executing command (password masked):`);
console.log(`cat ${tempFilePath} | psql "postgresql://postgres.nztnugncfiauygvywyoz:******@aws-0-us-east-2.pooler.supabase.com:6543/postgres"`);

exec(command, (error, stdout, stderr) => {
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    if (error) {
        console.error('❌ Connection failed!');
        console.error('Error details:', stderr || error.message);
        console.log('\n📝 Troubleshooting tips:');
        console.log('1. Verify the password is correct');
        console.log('2. Check that psql is installed and accessible');
        console.log('3. Ensure network connectivity to the database server');
        process.exit(1);
    } else {
        console.log('\n✅ Connection successful!');
        console.log('🔍 Database information:');
        console.log(stdout);
        
        console.log('\n📝 Next steps:');
        console.log('1. You can now use this password for all database connections');
        console.log('2. Use this connection string format for direct SQL execution:');
        console.log(`   psql "postgresql://postgres.nztnugncfiauygvywyoz:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:6543/postgres"`);
        
        console.log('\n3. Use this format to pipe SQL files:');
        console.log(`   cat your_sql_file.sql | psql "postgresql://postgres.nztnugncfiauygvywyoz:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:6543/postgres"`);
        
        process.exit(0);
    }
});
