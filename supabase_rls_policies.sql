# SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
# Run these SQL commands in your Supabase SQL editor to secure your database

-- =========================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =========================================

-- Profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Workspaces table  
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Workspace members table
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Tasks table (if using Supabase for tasks)
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PROFILES TABLE POLICIES
-- =========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile (optional, usually not needed)
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- =========================================
-- EVENTS TABLE POLICIES
-- =========================================

-- Users can only view their own events
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own events
CREATE POLICY "Users can insert own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own events
CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own events
CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- WORKSPACES TABLE POLICIES
-- =========================================

-- Users can view workspaces they own or are members of
CREATE POLICY "Users can view accessible workspaces" ON workspaces
  FOR SELECT USING (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT user_id FROM workspace_members 
      WHERE workspace_id = id
    )
  );

-- Users can only create workspaces as themselves
CREATE POLICY "Users can create own workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only workspace owners can update workspace details
CREATE POLICY "Owners can update workspaces" ON workspaces
  FOR UPDATE USING (auth.uid() = owner_id);

-- Only workspace owners can delete workspaces
CREATE POLICY "Owners can delete workspaces" ON workspaces
  FOR DELETE USING (auth.uid() = owner_id);

-- =========================================
-- WORKSPACE MEMBERS TABLE POLICIES
-- =========================================

-- Users can view memberships for workspaces they have access to
CREATE POLICY "Users can view relevant memberships" ON workspace_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Workspace owners can add members
CREATE POLICY "Owners can add members" ON workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Workspace owners can remove members, or users can remove themselves
CREATE POLICY "Members can be removed appropriately" ON workspace_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- =========================================
-- TASKS TABLE POLICIES (if storing in Supabase)
-- =========================================

-- Uncomment if you decide to sync tasks to Supabase as well

-- CREATE POLICY "Users can view workspace tasks" ON tasks
--   FOR SELECT USING (
--     workspace_id IN (
--       SELECT id FROM workspaces 
--       WHERE owner_id = auth.uid() OR id IN (
--         SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
--       )
--     )
--   );

-- CREATE POLICY "Users can create workspace tasks" ON tasks
--   FOR INSERT WITH CHECK (
--     workspace_id IN (
--       SELECT id FROM workspaces 
--       WHERE owner_id = auth.uid() OR id IN (
--         SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
--       )
--     )
--   );

-- CREATE POLICY "Users can update workspace tasks" ON tasks
--   FOR UPDATE USING (
--     workspace_id IN (
--       SELECT id FROM workspaces 
--       WHERE owner_id = auth.uid() OR id IN (
--         SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
--       )
--     )
--   );

-- CREATE POLICY "Users can delete workspace tasks" ON tasks
--   FOR DELETE USING (
--     workspace_id IN (
--       SELECT id FROM workspaces 
--       WHERE owner_id = auth.uid() OR id IN (
--         SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
--       )
--     )
--   );

-- =========================================
-- VERIFICATION QUERIES
-- =========================================
-- Run these after setting up policies to verify they work

-- Test 1: Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'events', 'workspaces', 'workspace_members');

-- Test 2: List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 3: Check policy coverage (should return 0 for properly secured tables)
-- This shows tables with RLS enabled but no policies (security gap)
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true
  AND p.policyname IS NULL;

-- =========================================
-- SECURITY TESTING CHECKLIST
-- =========================================

-- □ Create test user accounts
-- □ Verify users can only see their own profiles
-- □ Verify users can upsert their own profiles
-- □ Verify users can only see their own events
-- □ Verify users can only access their workspaces  
-- □ Test workspace member access (add/remove users)
-- □ Attempt to access other users' data (should fail)
-- □ Test workspace owner vs member permissions
-- □ Verify policies work with your app's actual queries

-- =========================================
-- MAINTENANCE NOTES
-- =========================================

-- 1. Monitor policy performance with pg_stat_user_tables
-- 2. Review policies when adding new features
-- 3. Test policies regularly with multiple user accounts
-- 4. Consider adding audit logging for sensitive operations
-- 5. Review and rotate service keys regularly
