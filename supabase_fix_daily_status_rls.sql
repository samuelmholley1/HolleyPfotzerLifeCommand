-- ===========================================
-- DAILY STATUS TABLE RLS POLICY FIX
-- ===========================================
-- This script ensures the daily_status table has proper RLS policies
-- for users to save their daily briefing information.

-- Ensure RLS is enabled on daily_status table
ALTER TABLE public.daily_status ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow workspace members to read statuses" ON public.daily_status;
DROP POLICY IF EXISTS "Allow members to create their own status" ON public.daily_status;
DROP POLICY IF EXISTS "Allow members to update their own status" ON public.daily_status;
DROP POLICY IF EXISTS "Allow members to delete their own status" ON public.daily_status;

-- Create helper function if it doesn't exist
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

-- Policy for SELECT operations
-- Users can only read statuses if they are a member of the workspace
CREATE POLICY "Allow workspace members to read statuses" 
ON public.daily_status 
FOR SELECT 
USING (is_workspace_member(workspace_id, auth.uid()));

-- Policy for INSERT operations
-- A user can only insert a status for themselves in a workspace they belong to
CREATE POLICY "Allow members to create their own status" 
ON public.daily_status 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

-- Policy for UPDATE operations
-- A user can only update their own status
CREATE POLICY "Allow members to update their own status" 
ON public.daily_status 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for DELETE operations
-- A user can only delete their own status
CREATE POLICY "Allow members to delete their own status" 
ON public.daily_status 
FOR DELETE 
USING (user_id = auth.uid());

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
WHERE schemaname = 'public' AND tablename = 'daily_status';

-- List all policies on daily_status table
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
WHERE schemaname = 'public' AND tablename = 'daily_status'
ORDER BY cmd;

-- Test workspace membership function
-- Run this to verify the helper function works:
-- SELECT is_workspace_member('your-workspace-id'::uuid, auth.uid());

-- ===========================================
-- EXPECTED RESULTS
-- ===========================================
-- 1. ✅ RLS should be enabled on daily_status table
-- 2. ✅ Four policies should exist: SELECT, INSERT, UPDATE, DELETE
-- 3. ✅ Users should be able to save daily briefing data
-- 4. ✅ Daily briefing save functionality should work without errors
-- 5. ✅ Users can only access their own daily status data
