-- ===========================================
-- FIX WORKSPACE INSERT RLS POLICY
-- ===========================================
-- This script specifically addresses the INSERT RLS policy for the workspaces table
-- to allow new users to create their first workspace

BEGIN;

-- 1. Check if INSERT policy exists for workspaces
DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'workspaces'
          AND cmd = 'INSERT'
    ) INTO policy_exists;
    
    -- Output diagnostic info
    RAISE NOTICE 'Workspace INSERT policy exists: %', policy_exists;
    
    -- If policy doesn't exist, create it
    IF NOT policy_exists THEN
        RAISE NOTICE 'Creating workspace INSERT policy...';
        
        -- Create a policy that allows authenticated users to insert their own workspaces
        CREATE POLICY workspace_insert_policy ON public.workspaces
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = owner_id);
            
        RAISE NOTICE 'Workspace INSERT policy created successfully!';
    ELSE
        RAISE NOTICE 'Checking if workspace INSERT policy needs to be updated...';
        
        -- Drop and recreate the policy to ensure it's correct
        DROP POLICY IF EXISTS workspace_insert_policy ON public.workspaces;
        
        -- Create a policy that allows authenticated users to insert their own workspaces
        CREATE POLICY workspace_insert_policy ON public.workspaces
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = owner_id);
            
        RAISE NOTICE 'Workspace INSERT policy updated successfully!';
    END IF;
END $$;

-- 2. Ensure owner_id column exists and has proper constraints
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'workspaces'
          AND column_name = 'owner_id'
    ) INTO column_exists;
    
    -- Output diagnostic info
    RAISE NOTICE 'owner_id column exists: %', column_exists;
    
    -- If column doesn't exist, add it
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding owner_id column to workspaces table...';
        
        -- Add owner_id column
        ALTER TABLE public.workspaces 
        ADD COLUMN owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id);
        
        RAISE NOTICE 'owner_id column added successfully!';
    ELSE
        RAISE NOTICE 'owner_id column already exists';
    END IF;
END $$;

-- 3. Verify RLS is enabled on the workspaces table
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'workspaces'
    INTO rls_enabled;
    
    -- Output diagnostic info
    RAISE NOTICE 'RLS enabled on workspaces table: %', rls_enabled;
    
    -- If RLS is not enabled, enable it
    IF NOT rls_enabled THEN
        RAISE NOTICE 'Enabling RLS on workspaces table...';
        
        -- Enable RLS on the workspaces table
        ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'RLS enabled successfully on workspaces table!';
    END IF;
END $$;

-- 4. Create or update the create_user_workspace function
CREATE OR REPLACE FUNCTION public.create_user_workspace()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    workspace_id uuid;
    workspace_count int;
BEGIN
    -- Check if user already has a workspace
    SELECT COUNT(*) INTO workspace_count 
    FROM public.workspaces 
    WHERE owner_id = auth.uid();

    -- If user already has a workspace, return the first one found
    IF workspace_count > 0 THEN
        SELECT id INTO workspace_id FROM public.workspaces WHERE owner_id = auth.uid() LIMIT 1;
        RETURN workspace_id;
    END IF;

    -- Create a new workspace for the user
    INSERT INTO public.workspaces (name, owner_id)
    VALUES ('My Workspace', auth.uid())
    RETURNING id INTO workspace_id;
    
    -- Automatically make the user a member of their new workspace
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (workspace_id, auth.uid(), 'owner');
    
    -- Update user's profile with the active workspace
    UPDATE public.profiles
    SET active_workspace_id = workspace_id
    WHERE id = auth.uid();
    
    RETURN workspace_id;
END;
$$;

-- 5. Verify workspace_members table has proper policies
DO $$
BEGIN
    -- Check if INSERT policy exists for workspace_members
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'workspace_members'
          AND cmd = 'INSERT'
    ) THEN
        -- Create INSERT policy for workspace_members
        CREATE POLICY workspace_members_insert_policy ON public.workspace_members
            FOR INSERT
            TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.workspaces w 
                    WHERE w.id = workspace_id AND w.owner_id = auth.uid()
                )
                OR user_id = auth.uid()
            );
            
        RAISE NOTICE 'Created workspace_members INSERT policy';
    END IF;
END $$;

COMMIT;

-- Final verification query for diagnostic purposes
SELECT 
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = t.table_name AND rowsecurity = true
    ) THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_enabled,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = t.table_name AND cmd = 'INSERT'
    ) THEN '✅ INSERT Policy' ELSE '❌ No INSERT Policy' END as insert_policy
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('workspaces', 'workspace_members', 'profiles')
ORDER BY table_name;
