require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// For admin operations, we'll use the anon key since service role key isn't in env

// Create Supabase client with the available key
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  try {
    console.log('Running daily briefing functions SQL script...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'supabase_create_daily_briefing_functions.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL script into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each SQL statement individually using REST API
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      console.log(`Executing statement ${i+1}/${statements.length}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        
        if (error) {
          console.error(`Error executing statement ${i+1}:`, error);
        } else {
          console.log(`Successfully executed statement ${i+1}`);
        }
      } catch (stmtError) {
        console.error(`Exception executing statement ${i+1}:`, stmtError.message);
      }
    }
    
    if (error) {
      console.error('Error executing SQL:', error);
    } else {
      console.log('Successfully executed daily briefing functions SQL script');
      console.log(data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Run the SQL script
runSQL();
