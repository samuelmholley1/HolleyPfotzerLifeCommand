-- ===========================================
-- FOUNDATIONAL WORKSPACE TABLES CREATION
-- ===========================================
-- This script creates the core workspace tables that are referenced
-- by other parts of the system. Run this FIRST before other SQL scripts.

-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, workspace_id)
);

-- Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name text,
    avatar_url text,
    active_workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active_workspace_id ON public.profiles(active_workspace_id);

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create helper function for workspace membership (needed by other policies)
CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspace RLS Policies
DROP POLICY IF EXISTS "Users can read workspaces they belong to" ON public.workspaces;
CREATE POLICY "Users can read workspaces they belong to" 
ON public.workspaces 
FOR SELECT 
USING (is_workspace_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can update workspaces they belong to" ON public.workspaces;
CREATE POLICY "Users can update workspaces they belong to" 
ON public.workspaces 
FOR UPDATE 
USING (is_workspace_member(id, auth.uid()));

-- Workspace Members RLS Policies
DROP POLICY IF EXISTS "Users can read workspace memberships" ON public.workspace_members;
CREATE POLICY "Users can read workspace memberships" 
ON public.workspace_members 
FOR SELECT 
USING (user_id = auth.uid() OR is_workspace_member(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own workspace membership" ON public.workspace_members;
CREATE POLICY "Users can insert their own workspace membership" 
ON public.workspace_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create trigger function for updating updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check that all tables exist and have RLS enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('workspaces', 'workspace_members', 'profiles')
ORDER BY tablename;

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('workspaces', 'workspace_members', 'profiles')
ORDER BY tablename, cmd;

-- ===========================================
-- EXPECTED RESULTS
-- ===========================================
-- 1. ✅ Three tables should exist: workspaces, workspace_members, profiles
-- 2. ✅ All tables should have RLS enabled
-- 3. ✅ Helper function is_workspace_member should be created
-- 4. ✅ Basic RLS policies should be in place
-- 5. ✅ Triggers for updated_at should be working
