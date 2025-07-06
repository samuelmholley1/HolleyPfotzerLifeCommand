// scripts/seed-test-user.ts
// Inserts a mock user and workspace into the dedicated test Supabase project/schema.
// Run with: yarn ts-node scripts/seed-test-user.ts
// WARNING: Do not run against production DB. For test environment only.

import { createClient } from '@supabase/supabase-js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const SUPABASE_URL = process.env.TEST_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing TEST_SUPABASE_URL or TEST_SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const argv = yargs(hideBin(process.argv))
  .option('dry-run', {
    type: 'boolean',
    description: 'Print intended mutations without touching the database',
    default: false,
  })
  .help()
  .argv;

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001'; // Must match RLS policy
const MOCK_WORKSPACE_ID = '00000000-0000-4000-8000-000000000002';

async function seed() {
  if (argv['dry-run']) {
    console.log('DRY RUN: Would upsert mock user:', {
      id: MOCK_USER_ID,
      email: 'mock-e2e-user@example.com',
      name: 'Mock E2E User',
    });
    console.log('DRY RUN: Would upsert mock workspace:', {
      id: MOCK_WORKSPACE_ID,
      name: 'E2E Test Workspace',
      owner_id: MOCK_USER_ID,
    });
    console.log('DRY RUN: Would upsert workspace membership:', {
      user_id: MOCK_USER_ID,
      workspace_id: MOCK_WORKSPACE_ID,
      role: 'owner',
    });
    process.exit(0);
  }

  // Insert mock user
  await supabase.from('users').upsert([
    {
      id: MOCK_USER_ID,
      email: 'mock-e2e-user@example.com',
      name: 'Mock E2E User',
      created_at: new Date().toISOString(),
    },
  ]);

  // Insert mock workspace
  await supabase.from('workspaces').upsert([
    {
      id: MOCK_WORKSPACE_ID,
      name: 'E2E Test Workspace',
      owner_id: MOCK_USER_ID,
      created_at: new Date().toISOString(),
    },
  ]);

  // Insert workspace membership
  await supabase.from('workspace_members').upsert([
    {
      user_id: MOCK_USER_ID,
      workspace_id: MOCK_WORKSPACE_ID,
      role: 'owner',
      created_at: new Date().toISOString(),
    },
  ]);

  console.log('✅ Mock user and workspace seeded for E2E tests.');
}

seed().catch((err) => {
  console.error('❌ Seed script failed:', err);
  process.exit(1);
});
