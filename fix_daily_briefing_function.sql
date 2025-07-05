-- Fixed version of get_daily_briefing_members function
-- This fixes the "column reference user_id is ambiguous" error

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
        profiles.id AS user_id,
        profiles.name,
        profiles.email,
        profiles.avatar_url,
        profiles.updated_at AS last_active,
        'active'::TEXT AS status,
        NULL::TEXT AS custom_status
    FROM 
        profiles
    INNER JOIN 
        workspace_members ON profiles.id = workspace_members.profile_id
    WHERE 
        workspace_members.workspace_id = p_workspace_id
    ORDER BY 
        profiles.updated_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_daily_briefing_members(UUID) TO authenticated;
