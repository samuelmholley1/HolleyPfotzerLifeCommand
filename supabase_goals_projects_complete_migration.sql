-- ===========================================
-- GOALS AND PROJECTS MIGRATION - COMPLETE SETUP
-- ===========================================
-- This script sets up the complete Goals and Projects system
-- Run this script in Supabase SQL Editor after ensuring foundational tables exist

-- ============================
-- STEP 1: CREATE GOALS TABLE
-- ============================

-- Drop goals table if it exists to ensure clean creation
DROP TABLE IF EXISTS public.goals CASCADE;

-- Create goals table
CREATE TABLE public.goals (
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

-- Create indexes for goals
CREATE INDEX IF NOT EXISTS idx_goals_user_workspace ON public.goals(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON public.goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_category ON public.goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON public.goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal ON public.goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_goal_uuid ON public.goals(goal_uuid);

-- Enable RLS and create policies for goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

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
USING (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()))
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Allow members to delete their own goals" 
ON public.goals 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for goals updated_at
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ===============================
-- STEP 2: CREATE PROJECTS TABLE
-- ===============================

-- Drop projects table if it exists to ensure clean creation
DROP TABLE IF EXISTS public.projects CASCADE;

-- Create projects table
CREATE TABLE public.projects (
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

-- Create indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_user_workspace ON public.projects(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_goal ON public.projects(goal_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON public.projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_target_date ON public.projects(target_completion_date);
CREATE INDEX IF NOT EXISTS idx_projects_project_uuid ON public.projects(project_uuid);

-- Enable RLS and create policies for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

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
USING (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()))
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Allow members to delete their own projects" 
ON public.projects 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ===============================================
-- STEP 3: UPDATE EXISTING TABLES WITH NEW COLUMNS
-- ===============================================

-- Add project_id to events table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.events 
        ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_events_project ON public.events(project_id);
        RAISE NOTICE 'Added project_id column to events table';
    END IF;
END $$;

-- Add project_id and goal_id to tasks table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_tasks_project ON public.tasks(project_id);
        RAISE NOTICE 'Added project_id column to tasks table';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'goal_id'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_tasks_goal ON public.tasks(goal_id);
        RAISE NOTICE 'Added goal_id column to tasks table';
    END IF;
END $$;

-- ==============================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ==============================

-- First, ensure all tables exist before creating functions
DO $$
BEGIN
    -- Check if goals table exists and has the expected structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'goals'
    ) THEN
        RAISE EXCEPTION 'Goals table does not exist. Please run the table creation steps first.';
    END IF;
    
    -- Check if projects table exists and has the expected structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) THEN
        RAISE EXCEPTION 'Projects table does not exist. Please run the table creation steps first.';
    END IF;
    
    -- Check if priority column exists in projects table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'priority'
    ) THEN
        RAISE EXCEPTION 'Projects table is missing priority column. Please recreate the table.';
    END IF;
END $$;

-- Function to get user goals with statistics
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

-- Function to get user projects with statistics
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

-- Function to get projects for a specific goal
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

-- ========================
-- VERIFICATION & SUMMARY
-- ========================

SELECT 'Goals and Projects system setup complete!' as status;

-- Show table structures
SELECT 'GOALS TABLE STRUCTURE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'goals'
ORDER BY ordinal_position;

SELECT 'PROJECTS TABLE STRUCTURE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position;

-- Verify foreign key columns were added to existing tables
SELECT 'UPDATED COLUMNS:' as info;
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'events')
AND column_name IN ('project_id', 'goal_id')
ORDER BY table_name, column_name;
