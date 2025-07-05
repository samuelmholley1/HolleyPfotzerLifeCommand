#!/usr/bin/env node

/**
 * Fix Workspace RLS Insert Policy
 * This script applies the fix for workspace RLS INSERT policy issues
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Read the SQL file
const sqlFile = path.join(__dirname, 'fix_workspace_insert_rls.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Database configuration with the new password
const DB_PASSWORD = 'VLYrpK4L7Lg5E5Ld';
const DB_CONNECTION_STRING = `postgresql://postgres.nztnugncfiauygvywyoz:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

console.log('🔧 Fixing Workspace RLS INSERT Policy...');
console.log('=========================================');

// Create a temporary file to store the SQL
const tempFile = path.join(require('os').tmpdir(), 'fix-workspace-rls.sql');
fs.writeFileSync(tempFile, sqlContent);

// Execute the SQL using psql
const command = `cat ${tempFile} | psql "${DB_CONNECTION_STRING}"`;
console.log('🚀 Executing SQL fix (password masked):');
console.log(`cat ${tempFile} | psql "postgresql://postgres.nztnugncfiauygvywyoz:******@aws-0-us-east-2.pooler.supabase.com:6543/postgres"`);

exec(command, (error, stdout, stderr) => {
    // Clean up the temporary file
    try {
        fs.unlinkSync(tempFile);
    } catch (err) {
        console.error('Warning: Failed to clean up temporary file', err);
    }
    
    if (error) {
        console.error('❌ Failed to apply RLS fix!');
        console.error('Error details:', stderr || error.message);
        process.exit(1);
    }
    
    console.log('\n✅ SQL executed successfully!');
    
    if (stdout) {
        console.log('\n📋 SQL Output:');
        console.log(stdout);
    }
    
    console.log('\n📝 Next steps:');
    console.log('1. Restart your application');
    console.log('2. Verify that new users can now create workspaces');
    console.log('3. Check that all RLS policies are working correctly');
    
    // Now run verification script
    console.log('\n🔍 Running database verification...');
    const verifyFile = path.join(__dirname, 'verify_database_state.sql');
    const verifyContent = fs.readFileSync(verifyFile, 'utf8');
    const verifyTempFile = path.join(require('os').tmpdir(), 'verify-db.sql');
    
    fs.writeFileSync(verifyTempFile, verifyContent);
    const verifyCommand = `cat ${verifyTempFile} | psql "${DB_CONNECTION_STRING}"`;
    
    exec(verifyCommand, (verifyError, verifyStdout, verifyStderr) => {
        // Clean up the verification temporary file
        try {
            fs.unlinkSync(verifyTempFile);
        } catch (err) {
            console.error('Warning: Failed to clean up temporary verification file', err);
        }
        
        if (verifyError) {
            console.error('❌ Verification failed!');
            console.error('Error details:', verifyStderr || verifyError.message);
        } else {
            console.log('\n✅ Database verification complete:');
            console.log(verifyStdout);
        }
        
        process.exit(0);
    });
});
