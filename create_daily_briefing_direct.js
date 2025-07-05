require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- Create the get_daily_briefing_members function
CREATE OR REPLACE FUNCTION public.get_daily_briefing_members(p_workspace_id UUID)
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    last_active TIMESTAMPTZ,
    status TEXT,
    custom_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.name,
        p.email,
        p.avatar_url,
        p.updated_at AS last_active,
        'active' AS status,
        NULL AS custom_status
    FROM 
        profiles p
    INNER JOIN 
        workspace_members wm ON p.id = wm.profile_id
    WHERE 
        wm.workspace_id = p_workspace_id
    ORDER BY 
        p.updated_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_daily_briefing_members(UUID) TO authenticated;
`;

async function createDailyBriefingFunction() {
  console.log('Creating daily briefing function...');
  
  try {
    // Try using the SQL editor endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Successfully created daily briefing function');
      console.log('Response:', result);
    } else {
      console.log('❌ API call failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Error creating function:', error);
  }
  
  // Alternative: Try to test if the function already exists
  try {
    console.log('\n🔍 Testing if function already exists...');
    const { data, error } = await supabase.rpc('get_daily_briefing_members', { 
      p_workspace_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
    });
    
    if (error) {
      if (error.message.includes('Could not find the function')) {
        console.log('❌ Function does not exist yet');
      } else {
        console.log('✅ Function exists but errored (expected with dummy UUID):', error.message);
      }
    } else {
      console.log('✅ Function exists and returned data:', data);
    }
  } catch (testError) {
    console.error('❌ Error testing function:', testError);
  }
}

createDailyBriefingFunction();
