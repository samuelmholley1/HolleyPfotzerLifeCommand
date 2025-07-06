-- Check if daily briefing function exists
SELECT 
    routine_name, 
    routine_type,
    specific_schema,
    data_type
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public' 
    AND routine_name = 'get_daily_briefing_members';

-- Check permissions for the function
SELECT
    r.rolname AS role_name,
    p.proname AS function_name,
    has_function_privilege(r.oid, p.oid, 'EXECUTE') AS has_execute_privilege
FROM
    pg_roles r,
    pg_proc p
WHERE
    p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND p.proname = 'get_daily_briefing_members'
    AND r.rolname IN ('authenticated', 'anon');
