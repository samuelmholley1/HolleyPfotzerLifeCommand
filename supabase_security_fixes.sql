-- ===========================================
-- SECURITY FIXES FOR GOALS AND PROJECTS
-- ===========================================
-- This script fixes critical security vulnerabilities in the Goals and Projects system
-- Run this script AFTER the main migration has been completed

-- =============================================
-- SECTION 1: FIX HELPER FUNCTION VULNERABILITIES
-- =============================================

-- Fix get_user_goals_with_stats function with proper authorization
CREATE OR REPLACE FUNCTION get_user_goals_with_stats(
    p_user_id uuid,
    p_workspace_id uuid
) RETURNS TABLE (
    id uuid,
    title text,
    description text,
    status text,
    priority text,
    category text,
    target_date timestamp with time zone,
    start_date timestamp with time zone,
    completion_percentage integer,
    parent_goal_id uuid,
    tags jsonb,
    metrics jsonb,
    completed_at timestamp with time zone,
    goal_uuid text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    sub_goals_count bigint,
    projects_count bigint
) AS $$
BEGIN
    -- SECURITY CHECK: Validate the requesting user has access to this workspace
    IF NOT is_workspace_member(p_workspace_id, auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Not a workspace member';
    END IF;
    
    -- SECURITY CHECK: Users can only query their own data
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot access other users data';
    END IF;
    
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.description,
        g.status,
        g.priority,
        g.category,
        g.target_date,
        g.start_date,
        g.completion_percentage,
        g.parent_goal_id,
        g.tags,
        g.metrics,
        g.completed_at,
        g.goal_uuid,
        g.created_at,
        g.updated_at,
        COALESCE(sub.count, 0) as sub_goals_count,
        COALESCE(proj.count, 0) as projects_count
    FROM public.goals g
    LEFT JOIN (
        SELECT parent_goal_id, COUNT(*) as count 
        FROM public.goals 
        WHERE parent_goal_id IS NOT NULL 
        GROUP BY parent_goal_id
    ) sub ON g.id = sub.parent_goal_id
    LEFT JOIN (
        SELECT goal_id, COUNT(*) as count 
        FROM public.projects 
        WHERE goal_id IS NOT NULL 
        GROUP BY goal_id
    ) proj ON g.id = proj.goal_id
    WHERE g.user_id = p_user_id 
        AND g.workspace_id = p_workspace_id
    ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_user_projects_with_stats function with proper authorization
CREATE OR REPLACE FUNCTION get_user_projects_with_stats(
    p_user_id uuid,
    p_workspace_id uuid
) RETURNS TABLE (
    id uuid,
    goal_id uuid,
    title text,
    description text,
    status text,
    priority text,
    category text,
    start_date timestamp with time zone,
    target_completion_date timestamp with time zone,
    actual_completion_date timestamp with time zone,
    estimated_duration numeric,
    actual_duration numeric,
    completion_percentage integer,
    tags jsonb,
    milestones jsonb,
    resources jsonb,
    project_uuid text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    tasks_count bigint,
    completed_tasks_count bigint,
    events_count bigint,
    goal_title text
) AS $$
BEGIN
    -- SECURITY CHECK: Validate the requesting user has access to this workspace
    IF NOT is_workspace_member(p_workspace_id, auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Not a workspace member';
    END IF;
    
    -- SECURITY CHECK: Users can only query their own data
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot access other users data';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.goal_id,
        p.title,
        p.description,
        p.status,
        p.priority,
        p.category,
        p.start_date,
        p.target_completion_date,
        p.actual_completion_date,
        p.estimated_duration,
        p.actual_duration,
        p.completion_percentage,
        p.tags,
        p.milestones,
        p.resources,
        p.project_uuid,
        p.created_at,
        p.updated_at,
        COALESCE(t.count, 0) as tasks_count,
        COALESCE(tc.count, 0) as completed_tasks_count,
        COALESCE(e.count, 0) as events_count,
        g.title as goal_title
    FROM public.projects p
    LEFT JOIN public.goals g ON p.goal_id = g.id
    LEFT JOIN (
        SELECT project_id, COUNT(*) as count 
        FROM public.tasks 
        WHERE project_id IS NOT NULL 
        GROUP BY project_id
    ) t ON p.id = t.project_id
    LEFT JOIN (
        SELECT project_id, COUNT(*) as count 
        FROM public.tasks 
        WHERE project_id IS NOT NULL AND status = 'completed'
        GROUP BY project_id
    ) tc ON p.id = tc.project_id
    LEFT JOIN (
        SELECT project_id, COUNT(*) as count 
        FROM public.events 
        WHERE project_id IS NOT NULL 
        GROUP BY project_id
    ) e ON p.id = e.project_id
    WHERE p.user_id = p_user_id 
        AND p.workspace_id = p_workspace_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_projects_for_goal function with proper authorization
CREATE OR REPLACE FUNCTION get_projects_for_goal(
    p_goal_id uuid,
    p_user_id uuid
) RETURNS TABLE (
    id uuid,
    title text,
    description text,
    status text,
    priority text,
    category text,
    completion_percentage integer,
    start_date timestamp with time zone,
    target_completion_date timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
DECLARE
    v_workspace_id uuid;
BEGIN
    -- SECURITY CHECK: Get the workspace_id for the goal and validate access
    SELECT workspace_id INTO v_workspace_id 
    FROM public.goals 
    WHERE id = p_goal_id AND user_id = auth.uid();
    
    IF v_workspace_id IS NULL THEN
        RAISE EXCEPTION 'Access denied: Goal not found or not accessible';
    END IF;
    
    IF NOT is_workspace_member(v_workspace_id, auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Not a workspace member';
    END IF;
    
    -- SECURITY CHECK: Users can only query their own data
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot access other users data';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.status,
        p.priority,
        p.category,
        p.completion_percentage,
        p.start_date,
        p.target_completion_date,
        p.created_at,
        p.updated_at
    FROM public.projects p
    WHERE p.goal_id = p_goal_id 
        AND p.user_id = p_user_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SECTION 2: STRENGTHEN RLS POLICIES
-- =============================================

-- Drop and recreate the UPDATE policies with stronger security
DROP POLICY IF EXISTS "Allow members to update their own goals" ON public.goals;
CREATE POLICY "Allow members to update their own goals" 
ON public.goals 
FOR UPDATE 
USING (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()))
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "Allow members to update their own projects" ON public.projects;
CREATE POLICY "Allow members to update their own projects" 
ON public.projects 
FOR UPDATE 
USING (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()))
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

-- =============================================
-- SECTION 3: ADD WORKSPACE VALIDATION CONSTRAINTS
-- =============================================

-- Add function to validate goal-project workspace consistency
CREATE OR REPLACE FUNCTION validate_goal_project_workspace_consistency()
RETURNS trigger AS $$
BEGIN
    -- If linking a project to a goal, ensure they're in the same workspace
    IF NEW.goal_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.goals 
            WHERE id = NEW.goal_id 
            AND workspace_id = NEW.workspace_id
            AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Goal and project must be in the same workspace and owned by the same user';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce workspace consistency
DROP TRIGGER IF EXISTS validate_project_goal_workspace ON public.projects;
CREATE TRIGGER validate_project_goal_workspace
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION validate_goal_project_workspace_consistency();

-- =============================================
-- VERIFICATION
-- =============================================

SELECT 'Security fixes applied successfully!' as status;

-- Test the security checks work (these should fail if not authenticated properly)
SELECT 'Testing security - the following should show errors if run by unauthorized users:' as info;

-- This would fail for unauthorized access:
-- SELECT get_user_goals_with_stats('00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000000'::uuid);

SELECT 'Security fixes complete. All helper functions now require proper authorization.' as final_status;
