#!/bin/bash

# Execute SQL using Supabase REST API
SUPABASE_URL="https://nztnugncfiauygvywyoz.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dG51Z25jZmlhdXlndnl3eW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDIwNDIsImV4cCI6MjA2Njg3ODA0Mn0.OawaisMtiGffR-QzYZnFPVv4uVtg7rX_gMUjvODu1W8"

# SQL to create the daily briefing function
SQL="
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
AS \$\$
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
\$\$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_daily_briefing_members(UUID) TO authenticated;
"

echo "Executing SQL to create daily briefing function..."

# Try to execute using RPC call to a custom exec function (if it exists)
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${SQL}\"}"

echo -e "\n\nIf the above failed, you'll need to run the SQL manually in the Supabase dashboard."
