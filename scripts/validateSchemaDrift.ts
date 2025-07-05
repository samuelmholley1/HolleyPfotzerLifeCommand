// scripts/validateSchemaDrift.ts
// Node.js script to automate detection of schema drift, especially missing foreign key constraints, by comparing live DB to canonical DDL.
// Usage: npx ts-node scripts/validateSchemaDrift.ts

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getLiveForeignKeys() {
  // Query information_schema for all FKs in public schema
  const sql = `
    SELECT tc.table_name AS source_table, kcu.column_name AS source_column,
           ccu.table_name AS target_table, ccu.column_name AS target_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY source_table, source_column;
  `;
  // Supabase does not support arbitrary SQL, so this requires a Postgres function or direct psql access.
  // For now, print the SQL for manual execution if needed.
  console.log('Run this SQL in your SQL tool to get live FKs:');
  console.log(sql);
}

function parseDDLSnapshot(ddlsqlPath: string) {
  // Parse the DDL file for foreign key constraints
  const ddl = fs.readFileSync(ddlsqlPath, 'utf-8');
  const fkRegex = /CONSTRAINT\s+(\S+)\s+FOREIGN KEY \(([^)]+)\) REFERENCES ([^(]+)\(([^)]+)\)/gi;
  const fks = [];
  let match;
  while ((match = fkRegex.exec(ddl)) !== null) {
    fks.push({
      constraint: match[1],
      source_column: match[2].trim(),
      target_table: match[3].trim(),
      target_column: match[4].trim(),
    });
  }
  return fks;
}

(async () => {
  // 1. Print instructions for live FKs (manual step for now)
  await getLiveForeignKeys();
  // 2. Parse DDL snapshot for expected FKs
  const ddlPath = path.resolve(__dirname, '../DATABASE_SNAPSHOT_DDL.sql');
  const expectedFKs = parseDDLSnapshot(ddlPath);
  console.log('Expected FKs from DDL snapshot:', expectedFKs);
  // 3. (Manual) Compare live FKs to expected FKs and report discrepancies
  console.log('\nCompare the above with your live DB output. Any missing FKs indicate schema drift.');
})();
