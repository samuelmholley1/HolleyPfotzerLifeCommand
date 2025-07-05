# Workspace RLS Fix Guide

This guide addresses the issue of new users being unable to create workspaces due to Row Level Security (RLS) policy violations in the database.

## Problem

The error log shows:
```
ERROR [WORKSPACE] Failed to ensure user has workspace | {"error":"new row violates row-level security policy for table \"workspaces\""}
```

This happens when a new user tries to create their first workspace because:
1. The INSERT policy for the workspace table is missing or incorrectly configured
2. The application is attempting to insert a workspace without properly setting the owner_id

## Solution Files

1. **fix_workspace_insert_rls.sql**: SQL script to fix RLS policies
2. **apply-workspace-rls-fix.js**: Node.js script to apply the SQL fix
3. **workspace-service-fixed.ts**: Updated workspace service implementation
4. **verify_database_state.sql**: Enhanced SQL to verify database state

## Step 1: Fix Database RLS Policies

Run the following script to fix the database RLS policies:

```bash
node apply-workspace-rls-fix.js
```

This will:
- Add the missing INSERT policy for workspaces
- Ensure the owner_id column exists with proper constraints
- Enable RLS on the workspaces table
- Create or update the create_user_workspace function

## Step 2: Replace Workspace Service

Replace your current workspace-service.ts file with the fixed version:

```bash
cp workspace-service-fixed.ts workspace-service.ts
```

Key improvements in the new service:
- Direct call to the database function that handles RLS correctly
- Simplified workspace creation process that leverages the database function
- Proper error handling and logging

## Step 3: Verify the Fix

1. Restart your application:
```bash
npm run web
```

2. Test with a new user account
3. Check the logs to confirm no more RLS errors

## Additional Notes

- The database password has been updated to: `VLYrpK4L7Lg5E5Ld`
- All scripts have been updated to use this new password
- Run `test-db-connection.js` to verify you can connect to the database

## Troubleshooting

If issues persist:

1. Check the logs for any specific errors
2. Run `node test-db-connection.js` to verify database connectivity
3. Run `cat verify_database_state.sql | psql "postgresql://postgres.nztnugncfiauygvywyoz:VLYrpK4L7Lg5E5Ld@aws-0-us-east-2.pooler.supabase.com:6543/postgres"` to check database state
4. Ensure all environment variables are correctly set

## Database Schema Requirements

For workspaces to function correctly:

1. Workspaces table must have:
   - id (UUID, primary key)
   - name (text)
   - owner_id (UUID, foreign key to auth.users)
   - RLS enabled with proper policies

2. Required RLS Policies:
   - SELECT: Allow users to select workspaces they are members of
   - INSERT: Allow authenticated users to create workspaces with their user ID as owner_id
   - UPDATE: Allow workspace owners to update their workspaces
   - DELETE: Allow workspace owners to delete their workspaces
