-- validate_slugs_and_relationships.sql
-- Automated validation for slugs/labels and relationship integrity in all core tables.
-- Run this in Supabase or psql to surface issues before beta testing.
--
-- 1. Find records missing slugs/labels
SELECT 'tasks' AS table, id FROM tasks WHERE slug IS NULL OR slug = '';
SELECT 'goals' AS table, id FROM goals WHERE slug IS NULL OR slug = '';
SELECT 'projects' AS table, id FROM projects WHERE slug IS NULL OR slug = '';
SELECT 'workspaces' AS table, id FROM workspaces WHERE slug IS NULL OR slug = '';
SELECT 'workspace_members' AS table, id FROM workspace_members WHERE label IS NULL OR label = '';
SELECT 'clarifications' AS table, id FROM clarifications WHERE label IS NULL OR label = '';
SELECT 'clarification_responses' AS table, id FROM clarification_responses WHERE label IS NULL OR label = '';
SELECT 'communication_modes' AS table, row_number() OVER () AS id FROM communication_modes WHERE label IS NULL OR label = '';

-- 2. Detect duplicate slugs/labels
SELECT 'tasks' AS table, slug, COUNT(*) FROM tasks WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;
SELECT 'goals' AS table, slug, COUNT(*) FROM goals WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;
SELECT 'projects' AS table, slug, COUNT(*) FROM projects WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;
SELECT 'workspaces' AS table, slug, COUNT(*) FROM workspaces WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;
SELECT 'workspace_members' AS table, label, COUNT(*) FROM workspace_members WHERE label IS NOT NULL GROUP BY label HAVING COUNT(*) > 1;

-- 3. Orphan detection (broken relationships)
-- Only check relationships that actually exist in your schema.
-- Removed tasks.project_id orphan check (no such column in your schema).

-- Fix: tasks table does not have goal_id, but projects does. Remove tasks-goals orphan check.

SELECT p.id AS project_id, p.slug AS project_slug, p.title, p.workspace_id, p.user_id, p.created_at, p.updated_at, p.status, p.priority, p.goal_id
FROM projects p
LEFT JOIN goals g ON p.goal_id = g.id
WHERE p.goal_id IS NOT NULL AND g.id IS NULL;

SELECT wm.id AS member_id, wm.user_id, wm.workspace_id, wm.role, wm.created_at, wm.label
FROM workspace_members wm
LEFT JOIN workspaces w ON wm.workspace_id = w.id
WHERE wm.workspace_id IS NOT NULL AND w.id IS NULL;

-- Add more checks as needed for new tables/relationships.
