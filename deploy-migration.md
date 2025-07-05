# Deploy Communication State Machine Migration

## Critical Action Required

The app is failing because the `communication_modes` table doesn't exist in your Supabase database.

**Error Log:**
```
relation "public.communication_modes" does not exist
```

## Deploy Steps

1. **Open Supabase Dashboard**: Go to your project at https://supabase.com/dashboard
2. **Navigate to SQL Editor**: Click "SQL Editor" in the left sidebar
3. **Copy Migration**: Copy the entire contents of `supabase_communication_state_machine.sql`
4. **Paste and Run**: Paste into SQL Editor and click "Run"

## Migration File Location
`/HolleyPfotzerLifeCommand/supabase_communication_state_machine.sql`

## What This Migration Does
- Adds state machine fields to `communication_modes` table
- Creates `communication_state_transitions` table for logging
- Adds RLS policies for security
- Creates helper functions for state management
- Sets up indexes for performance

## Verification
After running the migration, the app should:
- Stop showing 404 errors for `communication_modes`
- Display the communication status bar properly
- Allow state machine functionality

**Status**: 🔴 BLOCKING - Deploy immediately to fix app functionality
