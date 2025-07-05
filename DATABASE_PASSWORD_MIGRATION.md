# Database Password Migration Guide

This document provides instructions for using the new database password (`VLYrpK4L7Lg5E5Ld`) with Supabase in this project.

## Updated Files

The following files have been updated with the new database password:

1. `/HolleyPfotzerLifeCommand/.env` - Added `SUPABASE_DB_PASSWORD` variable
2. `/HolleyPfotzerLifeCommand/server/.env` - Added `SUPABASE_DB_PASSWORD` variable
3. `/HolleyPfotzerLifeCommand/deploy-workspace-rls-fix.sh` - Updated connection string
4. Created `/HolleyPfotzerLifeCommand/migrate-workspace-rls-updated.js` with new password
5. Created `/HolleyPfotzerLifeCommand/step3-create-projects-updated.js` with new password

## Connection Strings

For direct SQL execution, use the following connection string format:

```bash
psql "postgresql://postgres.nztnugncfiauygvywyoz:VLYrpK4L7Lg5E5Ld@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
```

Or to pipe SQL files:

```bash
cat your_sql_file.sql | psql "postgresql://postgres.nztnugncfiauygvywyoz:VLYrpK4L7Lg5E5Ld@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
```

## Script Usage

### Check Database Status

```bash
node check-db-status-updated.js
```

### Run Workspace RLS Migration

```bash
node migrate-workspace-rls-updated.js
```

### Create Projects Table

```bash
node step3-create-projects-updated.js
```

## Important Notes

1. Do not commit files with the database password to public repositories
2. If you need to update additional scripts or configuration files, use the updated scripts as templates
3. Make sure any deployment or CI/CD systems are updated with the new password

## Verification

After updating the password in all necessary files, you can verify that everything is working correctly by running:

```bash
node check-db-status-updated.js
```

If successful, you should see a message indicating that the database connection is working properly.
