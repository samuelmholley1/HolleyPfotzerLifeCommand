// WatermelonDB migration: Schema v12 alignment (Supabase 20250705)
// See lib/db/schema.ts and src/types/supabase.ts for canonical types.
// Only changes: tasks.priority (string → number), local-only field comments.

import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 12,
      steps: [
        // Change 'priority' in 'tasks' from string to number
        { changeColumn: {
            table: 'tasks',
            column: 'priority',
            type: 'number',
          }
        },
        // No-op for local-only fields (comments only)
      ]
    }
  ]
});
