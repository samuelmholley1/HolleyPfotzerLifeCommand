-- Detailed check of database state
SELECT 'Checking table columns...' as status;

-- Check projects table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'projects'
ORDER BY ordinal_position
LIMIT 10;

-- Check if workspaces has owner_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'workspaces'
    AND column_name = 'owner_id';

-- Check RLS policies
SELECT tablename, policyname, cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('workspaces', 'projects', 'goals')
ORDER BY tablename, cmd;
