-- ===========================================
-- CREATE GOALS TABLE
-- ===========================================
-- This script creates the goals table with proper RLS policies

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'on_hold', 'completed', 'cancelled')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category text NOT NULL CHECK (category IN ('health', 'career', 'financial', 'personal', 'relationships', 'learning')),
    target_date timestamp with time zone,
    start_date timestamp with time zone,
    completion_percentage integer NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    parent_goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE,
    tags jsonb DEFAULT '[]'::jsonb,
    metrics jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp with time zone,
    goal_uuid text UNIQUE,
    is_synced boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_user_workspace ON public.goals(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON public.goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_category ON public.goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON public.goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal ON public.goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_goal_uuid ON public.goals(goal_uuid);

-- Enable RLS on goals table
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "Allow workspace members to read goals" 
ON public.goals 
FOR SELECT 
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Allow members to create their own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Allow members to update their own goals" 
ON public.goals 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow members to delete their own goals" 
ON public.goals 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get user goals with progress statistics
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

-- Verification
SELECT 'Goals table created successfully!' as status;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'goals'
ORDER BY ordinal_position;
