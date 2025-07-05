-- Simple test to check current database state
SELECT 'Checking table existence...' as status;

-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
