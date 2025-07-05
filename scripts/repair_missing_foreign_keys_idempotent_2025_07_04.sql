-- repair_missing_foreign_keys_idempotent_2025_07_04.sql
-- Idempotent SQL migration: only adds missing foreign key constraints.
-- Safe to run multiple times. Review and run in Supabase SQL editor or psql.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'capacity_status_user_id_fkey' AND table_name = 'capacity_status') THEN
        ALTER TABLE capacity_status ADD CONSTRAINT capacity_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clarification_responses_responder_id_fkey' AND table_name = 'clarification_responses') THEN
        ALTER TABLE clarification_responses ADD CONSTRAINT clarification_responses_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clarifications_proposer_id_fkey' AND table_name = 'clarifications') THEN
        ALTER TABLE clarifications ADD CONSTRAINT clarifications_proposer_id_fkey FOREIGN KEY (proposer_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'communication_events_user_id_fkey' AND table_name = 'communication_events') THEN
        ALTER TABLE communication_events ADD CONSTRAINT communication_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'debug_loops_user_id_fkey' AND table_name = 'debug_loops') THEN
        ALTER TABLE debug_loops ADD CONSTRAINT debug_loops_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'goals_user_id_fkey' AND table_name = 'goals') THEN
        ALTER TABLE goals ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_user_id_fkey' AND table_name = 'projects') THEN
        ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_user_id_fkey' AND table_name = 'tasks') THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_assigned_to_fkey' AND table_name = 'tasks') THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_status_user_id_fkey' AND table_name = 'user_status') THEN
        ALTER TABLE user_status ADD CONSTRAINT user_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workspace_members_user_id_fkey' AND table_name = 'workspace_members') THEN
        ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workspaces_owner_id_fkey' AND table_name = 'workspaces') THEN
        ALTER TABLE workspaces ADD CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);
    END IF;
END $$;
