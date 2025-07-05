-- ===========================================
-- SECURITY VALIDATION TESTS
-- ===========================================
-- This script tests that the security fixes are working properly
-- Run this script AFTER applying the security fixes

-- =============================================
-- TEST 1: VERIFY RLS POLICIES ARE ACTIVE
-- =============================================

SELECT 'Testing RLS Policy Status...' as test_section;

SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('goals', 'projects')
ORDER BY tablename;

-- =============================================
-- TEST 2: VERIFY HELPER FUNCTIONS EXIST
-- =============================================

SELECT 'Testing Helper Functions...' as test_section;

SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_user_goals_with_stats',
    'get_user_projects_with_stats', 
    'get_projects_for_goal',
    'is_workspace_member'
)
ORDER BY routine_name;

-- =============================================
-- TEST 3: VERIFY POLICIES ARE PROPERLY CONFIGURED
-- =============================================

SELECT 'Testing RLS Policy Configuration...' as test_section;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as "Operation",
    CASE 
        WHEN qual IS NOT NULL AND with_check IS NOT NULL THEN 'Both USING and WITH CHECK'
        WHEN qual IS NOT NULL THEN 'USING only'
        WHEN with_check IS NOT NULL THEN 'WITH CHECK only'
        ELSE 'No conditions'
    END as "Policy Type"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('goals', 'projects')
AND policyname LIKE '%update%'
ORDER BY tablename, policyname;

-- =============================================
-- TEST 4: VERIFY WORKSPACE VALIDATION TRIGGER
-- =============================================

SELECT 'Testing Workspace Validation Trigger...' as test_section;

SELECT 
    trigger_name,
    event_manipulation,
    trigger_schema,
    trigger_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_table = 'projects'
AND trigger_name = 'validate_project_goal_workspace';

-- =============================================
-- TEST 5: SECURITY FUNCTION VALIDATION
-- =============================================

SELECT 'Security Function Implementation Check...' as test_section;

-- Check if functions have proper error handling
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as parameters,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%RAISE EXCEPTION%Access denied%' THEN 'Has Security Checks'
        ELSE 'Missing Security Checks'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_user_goals_with_stats',
    'get_user_projects_with_stats',
    'get_projects_for_goal'
);

-- =============================================
-- TEST 6: CONSTRAINT VERIFICATION
-- =============================================

SELECT 'Testing Table Constraints...' as test_section;

-- Check goals table constraints
SELECT 
    'goals' as table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'goals'
AND constraint_type IN ('CHECK', 'FOREIGN KEY')
ORDER BY constraint_name;

-- Check projects table constraints  
SELECT 
    'projects' as table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'projects'
AND constraint_type IN ('CHECK', 'FOREIGN KEY')
ORDER BY constraint_name;

-- =============================================
-- TEST 7: FOREIGN KEY RELATIONSHIPS
-- =============================================

SELECT 'Testing Foreign Key Security...' as test_section;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('goals', 'projects', 'tasks', 'events')
ORDER BY tc.table_name, kcu.column_name;

-- =============================================
-- SECURITY VALIDATION SUMMARY
-- =============================================

SELECT 'SECURITY VALIDATION COMPLETE' as status;
SELECT 'All tests above should show proper security configurations.' as note;
SELECT 'If any test shows missing security checks or disabled RLS, investigate immediately.' as warning;
