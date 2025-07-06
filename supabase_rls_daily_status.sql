-- Supabase Row Level Security (RLS) policies for the daily_status table

-- 1. Enable RLS on the table
ALTER TABLE public.daily_status ENABLE ROW LEVEL SECURITY;

-- 2. Create a helper function to check if a user is a member of a workspace
--    This function will be used in our policies to simplify the logic.
CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Policy for SELECT operations
--    Users can only read statuses if they are a member of the workspace.
CREATE POLICY "Allow workspace members to read statuses" 
ON public.daily_status 
FOR SELECT 
USING (is_workspace_member(workspace_id, auth.uid()));

-- 4. Policy for INSERT operations
--    A user can only insert a status for themself in a workspace they belong to.
CREATE POLICY "Allow members to create their own status" 
ON public.daily_status 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

-- 5. Policy for UPDATE operations
--    A user can only update their own status.
CREATE POLICY "Allow members to update their own status" 
ON public.daily_status 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Policy for DELETE operations
--    A user can only delete their own status.
CREATE POLICY "Allow members to delete their own status" 
ON public.daily_status 
FOR DELETE 
USING (user_id = auth.uid());
