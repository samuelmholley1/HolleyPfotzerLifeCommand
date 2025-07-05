-- Function to get all members of a workspace with their profiles and latest daily status.
CREATE OR REPLACE FUNCTION get_daily_briefing_members(p_workspace_id uuid)
RETURNS TABLE ( 
    user_id uuid,
    full_name text,
    avatar_url text,
    status_id uuid,
    status_created_at timestamptz,
    energy_level text,
    main_focus text,
    heads_up text,
    updated_at timestamptz
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        wm.user_id,
        p.full_name,
        p.avatar_url,
        ds.id AS status_id,
        ds.created_at AS status_created_at,
        ds.energy_level::text,
        ds.main_focus,
        ds.heads_up,
        ds.updated_at
    FROM
        workspace_members AS wm
    JOIN
        profiles AS p ON wm.user_id = p.id
    LEFT JOIN
        daily_status AS ds ON p.id = ds.user_id
        AND ds.workspace_id = p_workspace_id
        AND ds.date = (now() AT TIME ZONE 'UTC')::date
    WHERE
        wm.workspace_id = p_workspace_id
    ORDER BY
        p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights to the authenticated role
GRANT EXECUTE ON FUNCTION get_daily_briefing_members(uuid) TO authenticated;
