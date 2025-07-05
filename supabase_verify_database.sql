-- ===========================================
-- DATABASE VERIFICATION SCRIPT
-- ===========================================
-- Run this to check the current state of your database

-- Check what tables exist
SELECT 
  schemaname, 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check foreign key constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Check if critical functions exist
SELECT 
  routine_name,
  routine_type,
  CASE WHEN routine_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_workspace_member', 'assign_user_to_default_workspace', 'update_updated_at_column')
ORDER BY routine_name;
