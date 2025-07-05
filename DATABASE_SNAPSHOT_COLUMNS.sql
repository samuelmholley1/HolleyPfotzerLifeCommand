-- DATABASE_SNAPSHOT_COLUMNS.sql
-- Human-readable table/column summary for onboarding, quick reference, and agent context.
-- To regenerate, run this SQL query in your Supabase SQL editor:
--   SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;
--
-- The output of this query should be saved as the contents of this file.
--
-- If you need only a subset of columns or tables, create a new file with a more specific name (e.g., DATABASE_SNAPSHOT_COLUMNS_TASKS.sql).

-- BEGIN ACTUAL OUTPUT (2025-07-04)
table_name, column_name, data_type
capacity_status, id, uuid
capacity_status, user_id, uuid
capacity_status, workspace_id, uuid
capacity_status, cognitive_capacity, text
capacity_status, communication_preference, text
capacity_status, trigger_sensitivity, text
capacity_status, last_debugging_circuit, timestamp with time zone
capacity_status, circuit_breaks_today, integer
capacity_status, date, date
capacity_status, created_at, timestamp with time zone
capacity_status, updated_at, timestamp with time zone
capacity_status, label, text
clarification_responses, id, uuid
clarification_responses, clarification_id, uuid
clarification_responses, responder_id, uuid
clarification_responses, assumption_index, integer
clarification_responses, response_status, text
clarification_responses, created_at, timestamp with time zone
clarification_responses, label, text
clarifications, id, uuid
clarifications, workspace_id, uuid
clarifications, proposer_id, uuid
clarifications, created_at, timestamp with time zone
clarifications, topic, text
clarifications, assumptions, text
clarifications, status, text
clarifications, updated_at, timestamp with time zone
clarifications, clarification_uuid, text
clarifications, label, text
communication_events, id, uuid
communication_events, workspace_id, uuid
communication_events, user_id, uuid
communication_events, event_type, text
communication_events, content, jsonb
communication_events, resolved, boolean
communication_events, created_at, timestamp with time zone
communication_events, updated_at, timestamp with time zone
communication_modes, id, uuid
communication_modes, workspace_id, uuid
communication_modes, name, text
communication_modes, description, text
communication_modes, icon, text
communication_modes, active, boolean
communication_modes, created_at, timestamp with time zone
communication_modes, updated_at, timestamp with time zone
communication_modes, current_mode, text
communication_modes, timeout_end, timestamp with time zone
communication_modes, last_break_timestamp, timestamp with time zone
communication_modes, break_count_today, integer
communication_modes, partner_acknowledged, boolean
communication_modes, active_topic, text
communication_modes, paused_until, timestamp with time zone
communication_modes, break_acknowledged_by, ARRAY
communication_modes, label, text
debug_loops, id, uuid
debug_loops, workspace_id, uuid
debug_loops, user_id, uuid
debug_loops, title, text
debug_loops, description, text
debug_loops, status, text
debug_loops, priority, text
debug_loops, created_at, timestamp with time zone
debug_loops, updated_at, timestamp with time zone
debug_loops, closed_at, timestamp with time zone
debug_loops, label, text
goals, id, uuid
goals, user_id, uuid
goals, workspace_id, uuid
goals, title, text
goals, description, text
goals, status, text
goals, priority, text
goals, category, text
goals, target_date, timestamp with time zone
goals, start_date, timestamp with time zone
goals, completion_percentage, integer
goals, parent_goal_id, uuid
goals, tags, jsonb
goals, metrics, jsonb
goals, completed_at, timestamp with time zone
goals, goal_uuid, text
goals, is_synced, boolean
goals, created_at, timestamp with time zone
goals, updated_at, timestamp with time zone
goals, slug, text
profiles, id, uuid
profiles, full_name, text
profiles, avatar_url, text
profiles, active_workspace_id, uuid
profiles, created_at, timestamp with time zone
profiles, updated_at, timestamp with time zone
profiles, label, text
projects, id, uuid
projects, user_id, uuid
projects, workspace_id, uuid
projects, goal_id, uuid
projects, title, text
projects, description, text
projects, status, text
projects, priority, text
projects, category, text
projects, start_date, timestamp with time zone
projects, target_completion_date, timestamp with time zone
projects, actual_completion_date, timestamp with time zone
projects, estimated_duration, numeric
projects, actual_duration, numeric
projects, completion_percentage, integer
projects, tags, jsonb
projects, milestones, jsonb
projects, resources, jsonb
projects, project_uuid, text
projects, is_synced, boolean
projects, created_at, timestamp with time zone
projects, updated_at, timestamp with time zone
projects, slug, text
tasks, id, uuid
tasks, workspace_id, uuid
tasks, user_id, uuid
tasks, title, text
tasks, description, text
tasks, status, text
tasks, priority, text
tasks, due_date, timestamp with time zone
tasks, completed_at, timestamp with time zone
tasks, assigned_to, uuid
tasks, tags, ARRAY
tasks, metadata, jsonb
tasks, created_at, timestamp with time zone
tasks, updated_at, timestamp with time zone
tasks, slug, text
user_status, id, uuid
user_status, user_id, uuid
user_status, workspace_id, uuid
user_status, status, text
user_status, message, text
user_status, updated_at, timestamp with time zone
user_status, created_at, timestamp with time zone
workspace_members, id, uuid
workspace_members, user_id, uuid
workspace_members, workspace_id, uuid
workspace_members, role, text
workspace_members, created_at, timestamp with time zone
workspace_members, label, text
workspaces, id, uuid
workspaces, name, text
workspaces, description, text
workspaces, created_at, timestamp with time zone
workspaces, updated_at, timestamp with time zone
workspaces, owner_id, uuid
workspaces, slug, text
-- END ACTUAL OUTPUT (2025-07-04)
