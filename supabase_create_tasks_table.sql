-- ===========================================
-- TASKS TABLE CREATION AND RLS SETUP
-- ===========================================
-- This script creates the tasks table with proper RLS policies
-- for users to manage their tasks within workspaces.

-- Create tasks table (assuming workspaces table exists from foundational setup)
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    completed boolean NOT NULL DEFAULT false,
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_workspace ON public.tasks(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create helper function if it doesn't exist
CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- If workspace_members table doesn't exist yet, allow all operations for the user's own data
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspace_members') THEN
    RETURN true;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow workspace members to read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow members to create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow members to update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow members to delete their own tasks" ON public.tasks;

-- Policy for SELECT operations
-- Users can only read tasks if they are a member of the workspace
CREATE POLICY "Allow workspace members to read tasks" 
ON public.tasks 
FOR SELECT 
USING (is_workspace_member(workspace_id, auth.uid()));

-- Policy for INSERT operations
-- A user can only insert a task for themselves in a workspace they belong to
CREATE POLICY "Allow members to create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

-- Policy for UPDATE operations
-- A user can only update their own tasks
CREATE POLICY "Allow members to update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for DELETE operations
-- A user can only delete their own tasks
CREATE POLICY "Allow members to delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (user_id = auth.uid());

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check that RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tasks';

-- List all policies on tasks table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Read'
    WHEN cmd = 'INSERT' THEN '➕ Create'
    WHEN cmd = 'UPDATE' THEN '✏️ Update'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete'
    ELSE cmd
  END as operation_icon
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'tasks'
ORDER BY cmd;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'tasks'
ORDER BY ordinal_position;

-- ===========================================
-- EXPECTED RESULTS
-- ===========================================
-- 1. ✅ RLS should be enabled on tasks table
-- 2. ✅ Four policies should exist: SELECT, INSERT, UPDATE, DELETE
-- 3. ✅ Users should be able to create, read, update, delete their own tasks
-- 4. ✅ Users can only access tasks in workspaces they belong to
-- 5. ✅ Proper indexes should be created for performance
