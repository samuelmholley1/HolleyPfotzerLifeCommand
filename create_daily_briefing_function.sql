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
