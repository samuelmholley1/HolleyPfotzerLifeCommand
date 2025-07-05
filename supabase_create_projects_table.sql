-- ===========================================
-- CREATE PROJECTS TABLE
-- ===========================================
-- This script creates the projects table with proper RLS policies

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category text NOT NULL CHECK (category IN ('work', 'personal', 'health', 'learning', 'side_project')),
    start_date timestamp with time zone,
    target_completion_date timestamp with time zone,
    actual_completion_date timestamp with time zone,
    estimated_duration numeric, -- hours as decimal
    actual_duration numeric, -- hours as decimal
    completion_percentage integer NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    tags jsonb DEFAULT '[]'::jsonb,
    milestones jsonb DEFAULT '[]'::jsonb,
    resources jsonb DEFAULT '[]'::jsonb,
    project_uuid text UNIQUE,
    is_synced boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_completion_date CHECK (
        actual_completion_date IS NULL OR 
        start_date IS NULL OR 
        actual_completion_date >= start_date
    ),
    CONSTRAINT valid_target_date CHECK (
        target_completion_date IS NULL OR 
        start_date IS NULL OR 
        target_completion_date >= start_date
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_workspace ON public.projects(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_goal ON public.projects(goal_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON public.projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_target_date ON public.projects(target_completion_date);
CREATE INDEX IF NOT EXISTS idx_projects_project_uuid ON public.projects(project_uuid);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Allow workspace members to read projects" 
ON public.projects 
FOR SELECT 
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Allow members to create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Allow members to update their own projects" 
ON public.projects 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow members to delete their own projects" 
ON public.projects 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get user projects with task statistics
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

-- Helper function to get projects for a specific goal
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
BEGIN
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

-- Verification
SELECT 'Projects table created successfully!' as status;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position;
