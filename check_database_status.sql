-- ===========================================
-- CURRENT DATABASE STATUS CHECK
-- ===========================================
-- Run this first to see what tables currently exist

-- Check existing tables
SELECT 
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = table_name
  ) THEN '✅ Has RLS Policies' ELSE '❌ No RLS Policies' END as rls_status,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = table_name AND rowsecurity = true
  ) THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_enabled
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if workspaces table has owner_id column
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'workspaces'
ORDER BY ordinal_position;

-- Check existing functions
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_workspace_member', 'create_user_workspace', 'assign_user_to_default_workspace')
ORDER BY routine_name;

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ===========================================
-- RESULTS INTERPRETATION
-- ===========================================

/*
WHAT TO LOOK FOR:

1. TABLES THAT SHOULD EXIST:
   - workspaces ✅
   - workspace_members ✅  
   - profiles ✅

2. WORKSPACES TABLE SHOULD HAVE:
   - owner_id column (uuid type)

3. FUNCTIONS THAT SHOULD EXIST:
   - is_workspace_member
   - create_user_workspace (after RLS fix)
   - assign_user_to_default_workspace

4. TABLES THAT MIGHT NOT EXIST YET:
   - goals (this is what caused your error)
   - projects  
   - tasks
   - events

5. RLS STATUS:
   - All tables should show "RLS Enabled"
   - Key tables should show "Has RLS Policies"

NEXT STEPS BASED ON RESULTS:
- If workspaces missing owner_id → Run workspace RLS fix
- If goals table missing → Run goals table creation
- If basic tables missing → Run foundational tables first
*/
