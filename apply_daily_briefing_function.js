// apply_daily_briefing_function.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the SQL file path
const sqlFilePath = path.join(__dirname, 'create_daily_briefing_function.sql');
console.log(`Using SQL file: ${sqlFilePath}`);

// Database connection details from environment
const dbHost = 'db.wszcbzndumvnkfxadrrr.supabase.co';
const dbPort = '5432';
const dbName = 'postgres';
const dbUser = 'postgres';
const dbPassword = 'VLYrpK4L7Lg5E5Ld';

// Function to run the psql command
function runPsql() {
  return new Promise((resolve, reject) => {
    // Command: psql "postgres://postgres:password@host:port/dbname" -f sql_file.sql
    const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    console.log(`Connecting to database: ${connectionString.replace(dbPassword, '********')}`);
    
    const psql = spawn('psql', [connectionString, '-f', sqlFilePath]);
    
    let stdoutData = '';
    let stderrData = '';
    
    psql.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      stdoutData += output;
    });
    
    psql.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(error);
      stderrData += error;
    });
    
    psql.on('close', (code) => {
      console.log(`psql process exited with code ${code}`);
      
      if (code !== 0) {
        reject(new Error(`psql exited with code ${code}: ${stderrData}`));
      } else {
        resolve(stdoutData);
      }
    });
    
    psql.on('error', (err) => {
      console.error('Failed to start psql process:', err);
      reject(err);
    });
  });
}

// Execute the SQL file
console.log('Applying daily briefing function to database...');
runPsql()
  .then((output) => {
    console.log('✅ Successfully applied daily briefing function to database');
    console.log(output);
  })
  .catch((error) => {
    console.error('❌ Error applying daily briefing function:', error);
    process.exit(1);
  });
