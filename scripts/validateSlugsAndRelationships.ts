// scripts/validateSlugsAndRelationships.ts
// Node.js script to automate validation of slugs/labels and relationship integrity using Supabase/Postgres.
// Usage: npx ts-node scripts/validateSlugsAndRelationships.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkMissingSlugsLabels() {
  const tables = [
    { name: 'tasks', column: 'slug' },
    { name: 'goals', column: 'slug' },
    { name: 'projects', column: 'slug' },
    { name: 'workspaces', column: 'slug' },
    { name: 'workspace_members', column: 'label' },
    { name: 'clarifications', column: 'label' },
    { name: 'clarification_responses', column: 'label' },
    { name: 'communication_modes', column: 'label' },
  ];
  for (const { name, column } of tables) {
    const { data, error } = await supabase
      .from(name)
      .select('id')
      .is(column, null);
    if (error) {
      console.error(`Error checking ${name}:`, error.message);
      continue;
    }
    if (data && data.length > 0) {
      console.warn(`Missing ${column} in ${name}:`, data.map((row: any) => row.id));
    }
  }
}

async function checkDuplicateSlugsLabels() {
  const queries = [
    `SELECT 'tasks' AS table, slug, COUNT(*) FROM tasks WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1`,
    `SELECT 'goals' AS table, slug, COUNT(*) FROM goals WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1`,
    `SELECT 'projects' AS table, slug, COUNT(*) FROM projects WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1`,
    `SELECT 'workspaces' AS table, slug, COUNT(*) FROM workspaces WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1`,
    `SELECT 'workspace_members' AS table, label, COUNT(*) FROM workspace_members WHERE label IS NOT NULL GROUP BY label HAVING COUNT(*) > 1`,
  ];
  for (const sql of queries) {
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
      console.error('Error running duplicate check:', error.message);
      continue;
    }
    if (data && data.length > 0) {
      console.warn('Duplicate slugs/labels found:', data);
    }
  }
}

async function checkOrphans() {
  // This requires custom SQL or a Postgres function; for now, recommend running the SQL script directly.
  console.log('For orphan detection, please run validate_slugs_and_relationships.sql in Supabase SQL editor.');
}

(async () => {
  await checkMissingSlugsLabels();
  await checkDuplicateSlugsLabels();
  await checkOrphans();
  console.log('Validation complete.');
})();
