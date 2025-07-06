-- 20250705_mock_user_rls.sql
-- RLS policy for E2E mock user. Only allows access to their own workspace.
-- DO NOT APPLY TO PRODUCTION. For test Supabase only.
-- Mock user: 00000000-0000-4000-8000-000000000001

-- Enable RLS for all relevant tables (idempotent)
DO $$ BEGIN ALTER TABLE users ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE tasks ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN END $$;

-- USERS TABLE: Allow mock user to read/update their own row
CREATE POLICY "Allow mock user to read/update self (E2E only)"
  ON users
  FOR SELECT, UPDATE
  USING (auth.uid() = '00000000-0000-4000-8000-000000000001' AND id = auth.uid())
  WITH CHECK (auth.uid() = '00000000-0000-4000-8000-000000000001' AND id = auth.uid());

-- WORKSPACES TABLE: Allow mock user to read/update their own workspace
CREATE POLICY "Allow mock user to read/update own workspace (E2E only)"
  ON workspaces
  FOR SELECT, UPDATE
  USING (auth.uid() = '00000000-0000-4000-8000-000000000001' AND owner_id = auth.uid())
  WITH CHECK (auth.uid() = '00000000-0000-4000-8000-000000000001' AND owner_id = auth.uid());

-- WORKSPACE_MEMBERS TABLE: Allow mock user to read/update their own membership
CREATE POLICY "Allow mock user to read/update own membership (E2E only)"
  ON workspace_members
  FOR SELECT, UPDATE
  USING (auth.uid() = '00000000-0000-4000-8000-000000000001' AND user_id = auth.uid())
  WITH CHECK (auth.uid() = '00000000-0000-4000-8000-000000000001' AND user_id = auth.uid());

-- TASKS TABLE: Allow mock user to read/write tasks in their workspace
CREATE POLICY "Allow mock user to read/write tasks in own workspace (E2E only)"
  ON tasks
  FOR SELECT, INSERT, UPDATE, DELETE
  USING (
    auth.uid() = '00000000-0000-4000-8000-000000000001'
    AND workspace_id = (
      SELECT id FROM workspaces WHERE owner_id = auth.uid() LIMIT 1
    )
  )
  WITH CHECK (
    auth.uid() = '00000000-0000-4000-8000-000000000001'
    AND workspace_id = (
      SELECT id FROM workspaces WHERE owner_id = auth.uid() LIMIT 1
    )
  );

-- NOTE: This policy is for E2E/CI only. Do not delete the mock user or workspace without updating this policy.
