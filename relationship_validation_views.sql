-- relationship_validation_views.sql
-- SQL views and scripts for validating core table relationships by both foreign key and human-friendly slug/label.
-- Generated: 2025-07-04
--
-- 1. Tasks to Projects (by project_id and slug)
CREATE OR REPLACE VIEW tasks_with_project_info AS
SELECT t.id AS task_id, t.slug AS task_slug, t.project_id, p.id AS project_id_ref, p.slug AS project_slug
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id;

-- 2. Tasks to Goals (by goal_id and slug)
CREATE OR REPLACE VIEW tasks_with_goal_info AS
SELECT t.id AS task_id, t.slug AS task_slug, t.goal_id, g.id AS goal_id_ref, g.slug AS goal_slug
FROM tasks t
LEFT JOIN goals g ON t.goal_id = g.id;

-- 3. Projects to Goals (by goal_id and slug)
CREATE OR REPLACE VIEW projects_with_goal_info AS
SELECT p.id AS project_id, p.slug AS project_slug, p.goal_id, g.id AS goal_id_ref, g.slug AS goal_slug
FROM projects p
LEFT JOIN goals g ON p.goal_id = g.id;

-- 4. Workspace Members to Workspaces (by workspace_id and slug)
CREATE OR REPLACE VIEW workspace_members_with_workspace_info AS
SELECT wm.id AS member_id, wm.label AS member_label, wm.workspace_id, w.id AS workspace_id_ref, w.slug AS workspace_slug
FROM workspace_members wm
LEFT JOIN workspaces w ON wm.workspace_id = w.id;

-- 5. Orphan detection: Tasks with missing project or goal
CREATE OR REPLACE VIEW orphan_tasks AS
SELECT t.*
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN goals g ON t.goal_id = g.id
WHERE (t.project_id IS NOT NULL AND p.id IS NULL)
   OR (t.goal_id IS NOT NULL AND g.id IS NULL);

-- Add more as needed for other relationships.
