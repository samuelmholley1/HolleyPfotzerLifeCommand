-- ===========================================
-- COMPREHENSIVE WORKSPACE RLS FIX
-- ===========================================
-- This script fixes the Row Level Security issues preventing new users
-- from creating workspaces and accessing their default workspace.

-- Step 1: Add owner_id column to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);

-- Step 3: Update existing workspaces to have an owner (set to first member found)
UPDATE public.workspaces 
SET owner_id = (
  SELECT user_id 
  FROM public.workspace_members 
  WHERE workspace_id = workspaces.id 
    AND role IN ('owner', 'admin')
  ORDER BY 
    CASE WHEN role = 'owner' THEN 1 ELSE 2 END,
    created_at 
  LIMIT 1
)
WHERE owner_id IS NULL;

-- Step 4: Drop existing workspace policies
DROP POLICY IF EXISTS "Users can read workspaces they belong to" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update workspaces they belong to" ON public.workspaces;
DROP POLICY IF EXISTS "Users can insert workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;

-- Step 5: Create comprehensive workspace RLS policies

-- Allow users to read workspaces they belong to
CREATE POLICY "Users can read workspaces they belong to" 
ON public.workspaces 
FOR SELECT 
USING (
  -- User is a member of the workspace
  is_workspace_member(id, auth.uid()) 
  OR 
  -- User is the owner
  owner_id = auth.uid()
);

-- Allow users to create new workspaces (they become the owner)
CREATE POLICY "Users can create workspaces" 
ON public.workspaces 
FOR INSERT 
WITH CHECK (
  -- The user creating the workspace must be the owner
  owner_id = auth.uid()
);

-- Allow workspace owners and admins to update workspaces
CREATE POLICY "Users can update workspaces they own or admin" 
ON public.workspaces 
FOR UPDATE 
USING (
  -- User is the owner
  owner_id = auth.uid() 
  OR 
  -- User is an admin of the workspace
  EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = workspaces.id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  -- Same conditions for the check
  owner_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = workspaces.id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
  )
);

-- Step 6: Update workspace_members policies to handle owner role properly

DROP POLICY IF EXISTS "Users can insert their own workspace membership" ON public.workspace_members;
CREATE POLICY "Users can insert workspace membership" 
ON public.workspace_members 
FOR INSERT 
WITH CHECK (
  -- User can add themselves to any workspace
  user_id = auth.uid()
  OR
  -- Workspace owners/admins can add others
  EXISTS (
    SELECT 1 
    FROM public.workspaces w
    WHERE w.id = workspace_id 
      AND (w.owner_id = auth.uid() OR is_workspace_member(workspace_id, auth.uid()))
  )
);

-- Step 7: Create or replace the improved auto-assignment function
CREATE OR REPLACE FUNCTION assign_user_to_default_workspace()
RETURNS TRIGGER AS $$
DECLARE
    default_workspace_id uuid;
    workspace_name text := 'Personal Workspace';
BEGIN
    -- Try to find an existing default workspace for this user
    SELECT id INTO default_workspace_id 
    FROM public.workspaces 
    WHERE name = workspace_name 
      AND owner_id = NEW.id
    LIMIT 1;
    
    -- If no personal workspace exists, create one with the user as owner
    IF default_workspace_id IS NULL THEN
        INSERT INTO public.workspaces (name, description, owner_id, created_at, updated_at)
        VALUES (
            workspace_name,
            'Default personal workspace for productivity tracking',
            NEW.id,  -- Set the new user as the owner
            NOW(),
            NOW()
        )
        RETURNING id INTO default_workspace_id;
        
        RAISE NOTICE 'Created default workspace: % for user: %', default_workspace_id, NEW.id;
    END IF;
    
    -- Add user to the workspace with owner role
    INSERT INTO public.workspace_members (user_id, workspace_id, role, created_at)
    VALUES (NEW.id, default_workspace_id, 'owner', NOW())
    ON CONFLICT (user_id, workspace_id) DO UPDATE SET
        role = 'owner',  -- Ensure they have owner role
        created_at = LEAST(workspace_members.created_at, NOW());
    
    -- Create/update the user's profile with the active workspace
    INSERT INTO public.profiles (id, full_name, avatar_url, active_workspace_id, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        default_workspace_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        active_workspace_id = COALESCE(profiles.active_workspace_id, default_workspace_id),
        full_name = COALESCE(
            profiles.full_name, 
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        ),
        avatar_url = COALESCE(
            profiles.avatar_url,
            NEW.raw_user_meta_data->>'avatar_url'
        ),
        updated_at = NOW();
    
    RAISE NOTICE 'Assigned user % to workspace % with owner role and updated profile', NEW.id, default_workspace_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Ensure the trigger exists for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION assign_user_to_default_workspace();

-- Step 9: Create helper function for workspace creation from application
CREATE OR REPLACE FUNCTION create_user_workspace(
    p_workspace_name text,
    p_workspace_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_workspace_id uuid;
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a workspace';
    END IF;
    
    -- Create the workspace with the current user as owner
    INSERT INTO public.workspaces (name, description, owner_id, created_at, updated_at)
    VALUES (
        p_workspace_name,
        COALESCE(p_workspace_description, 'Workspace created by user'),
        current_user_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO new_workspace_id;
    
    -- Add the user as an owner member
    INSERT INTO public.workspace_members (user_id, workspace_id, role, created_at)
    VALUES (current_user_id, new_workspace_id, 'owner', NOW());
    
    -- Update user's active workspace if they don't have one
    UPDATE public.profiles 
    SET 
        active_workspace_id = COALESCE(active_workspace_id, new_workspace_id),
        updated_at = NOW()
    WHERE id = current_user_id;
    
    RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_workspace TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_to_default_workspace TO service_role;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check that workspaces table has owner_id column
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'workspaces'
ORDER BY ordinal_position;

-- List all workspace policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd as operation,
    qual as using_clause,
    with_check as check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'workspaces'
ORDER BY cmd, policyname;

-- Check trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ===========================================
-- MIGRATION VERIFICATION
-- ===========================================

-- Test if workspace creation function works (requires authenticated user)
-- This should be tested from your application, not directly in SQL

-- Expected results:
-- 1. ✅ workspaces table should have owner_id column
-- 2. ✅ Comprehensive RLS policies should be in place for workspaces
-- 3. ✅ Updated workspace_members policies should handle ownership
-- 4. ✅ Auto-assignment function should create personal workspaces with ownership
-- 5. ✅ Helper function should allow application-level workspace creation
-- 6. ✅ Trigger should be active for new user registration

COMMIT;
