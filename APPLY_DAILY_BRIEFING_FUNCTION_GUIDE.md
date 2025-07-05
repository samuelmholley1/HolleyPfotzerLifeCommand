# Apply Daily Briefing Function

Since we're having difficulty executing SQL directly through the scripts, here's how to apply the daily briefing function via the Supabase dashboard:

1. Log into the Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor section
4. Create a new query and paste the following SQL:

```sql
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
```

5. Execute the query by clicking "Run" or pressing Ctrl+Enter

## Verify Function Exists

After running the SQL, you can verify that the function exists by running this query:

```sql
SELECT 
    routine_name, 
    routine_type
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public' 
    AND routine_name = 'get_daily_briefing_members';
```

This should return one row confirming that the `get_daily_briefing_members` function exists.

## Testing the Function

To test that the function works correctly, run a query with a valid workspace ID:

```sql
SELECT * FROM get_daily_briefing_members('your-workspace-id-here');
```

Replace `your-workspace-id-here` with an actual workspace ID from your database.
