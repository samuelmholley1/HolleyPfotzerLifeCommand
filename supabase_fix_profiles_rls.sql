-- ===========================================
-- PROFILES TABLE RLS POLICY FIX
-- ===========================================
-- This script fixes the missing RLS policies for the profiles table
-- that are preventing users from upserting their profile data.

-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for profiles table
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (CRITICAL for upsert)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile (CRITICAL for upsert)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Users can delete their own profile (optional, for completeness)
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

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
WHERE schemaname = 'public' AND tablename = 'profiles';

-- List all policies on profiles table
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
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd;

-- Test query to verify policies work (should return your profile when authenticated)
-- Run this after applying the policies:
-- SELECT id, full_name, active_workspace_id FROM profiles WHERE id = auth.uid();

-- ===========================================
-- EXPECTED RESULTS AFTER RUNNING THIS SCRIPT
-- ===========================================
-- 1. ✅ RLS should be enabled on profiles table
-- 2. ✅ Four policies should exist: SELECT, INSERT, UPDATE, DELETE
-- 3. ✅ Users should be able to upsert their own profile data
-- 4. ✅ The WorkspaceService should no longer get 403 errors
-- 5. ✅ User onboarding and workspace assignment should work

-- ===========================================
-- TROUBLESHOOTING
-- ===========================================
-- If you still get 403 errors after running this:
-- 1. Verify the user is authenticated (auth.uid() returns a value)
-- 2. Check that the profiles table exists and has the correct structure
-- 3. Ensure your Supabase client has the correct API key and URL
-- 4. Try running the verification queries above
-- 5. Check Supabase logs for more detailed error messages
