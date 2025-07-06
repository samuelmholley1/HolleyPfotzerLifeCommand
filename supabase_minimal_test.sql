-- ===========================================
-- MINIMAL GOALS AND PROJECTS SETUP
-- ===========================================
-- This is a minimal script to create just the basic tables
-- Run this first to isolate any issues

-- Clean slate
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;

-- Create goals table (minimal version)
CREATE TABLE public.goals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'draft',
    priority text NOT NULL DEFAULT 'medium',
    category text NOT NULL,
    target_date timestamp with time zone,
    start_date timestamp with time zone,
    completion_percentage integer NOT NULL DEFAULT 0,
    parent_goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE,
    tags jsonb DEFAULT '[]'::jsonb,
    metrics jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp with time zone,
    goal_uuid text UNIQUE,
    is_synced boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Test: Can we select from goals?
SELECT 'Goals table created successfully' as status;
SELECT COUNT(*) as goal_count FROM public.goals;

-- Create projects table (minimal version)
CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'planning',
    priority text NOT NULL DEFAULT 'medium',
    category text NOT NULL,
    start_date timestamp with time zone,
    target_completion_date timestamp with time zone,
    actual_completion_date timestamp with time zone,
    estimated_duration numeric,
    actual_duration numeric,
    completion_percentage integer NOT NULL DEFAULT 0,
    tags jsonb DEFAULT '[]'::jsonb,
    milestones jsonb DEFAULT '[]'::jsonb,
    resources jsonb DEFAULT '[]'::jsonb,
    project_uuid text UNIQUE,
    is_synced boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Test: Can we select from projects?
SELECT 'Projects table created successfully' as status;
SELECT COUNT(*) as project_count FROM public.projects;

-- Test: Can we select priority from projects?
SELECT 'Testing priority column access' as test;
SELECT priority FROM public.projects LIMIT 1;

-- Verify both tables exist and have the expected columns
SELECT 'VERIFICATION - Tables and columns:' as verification;
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('goals', 'projects')
AND column_name IN ('priority', 'status', 'category')
ORDER BY table_name, column_name;
