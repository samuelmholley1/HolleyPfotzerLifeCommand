-- repair_missing_foreign_keys_2025_07_04.sql
-- SQL migration to restore missing foreign key constraints in the public schema.
-- Review and run in your Supabase SQL editor or psql.

ALTER TABLE capacity_status ADD CONSTRAINT capacity_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE clarification_responses ADD CONSTRAINT clarification_responses_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES auth.users(id);
ALTER TABLE clarifications ADD CONSTRAINT clarifications_proposer_id_fkey FOREIGN KEY (proposer_id) REFERENCES auth.users(id);
ALTER TABLE communication_events ADD CONSTRAINT communication_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE debug_loops ADD CONSTRAINT debug_loops_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE goals ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
ALTER TABLE user_status ADD CONSTRAINT user_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE workspaces ADD CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);
