-- ===========================================
-- VERIFY CURRENT DATABASE STATE
-- ===========================================
-- Quick check to see what's working after the SQL execution

-- Check if workspaces table has owner_id column (from RLS fix)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'workspaces'
    AND column_name = 'owner_id';

-- Check workspace RLS policies
SELECT 
    policyname,
    cmd as operation,
    permissive,
    qual as policy_condition,
    with_check as insert_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'workspaces'
ORDER BY cmd, policyname;

-- Check if goals table is properly created
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'goals'
ORDER BY ordinal_position
LIMIT 5;

-- Check goals RLS policies
SELECT 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'goals'
ORDER BY cmd;

-- Test if the workspace creation function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('create_user_workspace', 'get_user_goals_with_stats');
    
-- Check if workspace INSERT policy exists specifically
SELECT 
    policyname,
    cmd as operation,
    permissive,
    qual as policy_condition,
    with_check as insert_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'workspaces'
    AND cmd = 'INSERT';
    
SELECT 'Database verification complete!' as status;
