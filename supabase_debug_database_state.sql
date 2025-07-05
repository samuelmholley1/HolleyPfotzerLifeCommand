-- ===========================================
-- DEBUG: CHECK CURRENT DATABASE STATE
-- ===========================================
-- Run this script to see what tables and columns currently exist

-- Check if tables exist
SELECT 
    'TABLE EXISTENCE CHECK' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('goals', 'projects', 'tasks', 'events', 'workspaces')
ORDER BY table_name;

-- Check goals table structure if it exists
SELECT 'GOALS TABLE COLUMNS' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'goals'
ORDER BY ordinal_position;

-- Check projects table structure if it exists
SELECT 'PROJECTS TABLE COLUMNS' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position;

-- Check if project_id exists in tasks and events
SELECT 'FOREIGN KEY COLUMNS CHECK' as check_type;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'events')
AND column_name IN ('project_id', 'goal_id')
ORDER BY table_name, column_name;

-- Check existing RLS policies
SELECT 'RLS POLICIES CHECK' as check_type;
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('goals', 'projects')
ORDER BY tablename, policyname;
