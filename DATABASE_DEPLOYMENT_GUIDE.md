# 🚀 DATABASE DEPLOYMENT SCRIPT
# Complete Supabase Database Setup - Run in Correct Order

This script will guide you through setting up your complete database schema in the correct order to avoid dependency issues.

## 📋 DEPLOYMENT CHECKLIST

### Phase 1: Foundation Tables ✅
Run these scripts in the Supabase SQL Editor in this exact order:

#### 1. **Foundational Tables** (MUST BE FIRST)
```sql
-- File: supabase_create_foundational_tables.sql
-- Creates: workspaces, workspace_members, profiles
-- Status: ✅ Ready to run
```

#### 2. **Workspace RLS Fix** (IMMEDIATELY AFTER FOUNDATIONAL)
```sql
-- File: supabase_fix_workspace_rls_comprehensive.sql  
-- Adds: owner_id column, comprehensive RLS policies
-- Status: ✅ Ready to run
```

### Phase 2: Core Business Tables 📊
Run these after Phase 1 is complete:

#### 3. **Goals Table**
```sql
-- File: supabase_create_goals_table.sql
-- Creates: goals table with RLS policies
-- Depends on: workspaces, workspace_members
```

#### 4. **Projects Table**  
```sql
-- File: supabase_create_projects_table.sql
-- Creates: projects table with RLS policies
-- Depends on: goals, workspaces, workspace_members
```

#### 5. **Tasks Table**
```sql
-- File: supabase_create_tasks_table.sql
-- Creates: tasks table with RLS policies  
-- Depends on: projects, goals, workspaces
```

#### 6. **Events Table**
```sql
-- File: supabase_create_events_table.sql
-- Creates: events table with RLS policies
-- Depends on: projects, goals, workspaces
```

### Phase 3: Additional Features 🎯
Run these after Phase 2:

#### 7. **Daily Status**
```sql
-- File: supabase_create_daily_status_table.sql
-- Creates: daily_status table
-- File: supabase_fix_daily_status_rls.sql  
-- Fixes: RLS policies for daily status
```

#### 8. **State Machine (Optional)**
```sql
-- File: supabase_state_machine_extension_phase1.sql
-- Creates: communication state machine
-- File: supabase_communication_circuit_breaker_schema.sql
-- Creates: circuit breaker functionality
```

## 🔧 STEP-BY-STEP EXECUTION

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Create a new query

### Step 2: Run Foundation Scripts
Copy and paste the content from each file in this exact order:

#### A. Foundational Tables First
```bash
# Copy content from: supabase_create_foundational_tables.sql
# Paste in SQL Editor and run
```

#### B. Workspace RLS Fix Second  
```bash
# Copy content from: supabase_fix_workspace_rls_comprehensive.sql
# Paste in SQL Editor and run
```

### Step 3: Verify Foundation
After running the first two scripts, run this verification:

```sql
-- Verify foundation is complete
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('workspaces', 'workspace_members', 'profiles')
ORDER BY tablename;

-- Check workspace policies
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'workspaces' 
ORDER BY cmd;

-- Verify owner_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workspaces' AND column_name = 'owner_id';
```

**Expected Results:**
- ✅ All 3 tables should show "RLS Enabled"
- ✅ Multiple workspace policies should be listed
- ✅ owner_id column should exist with type "uuid"

### Step 4: Run Core Business Tables
Only proceed if Step 3 verification passes. Run in order:

```bash
# 1. Goals table
# Copy content from: supabase_create_goals_table.sql

# 2. Projects table  
# Copy content from: supabase_create_projects_table.sql

# 3. Tasks table
# Copy content from: supabase_create_tasks_table.sql

# 4. Events table
# Copy content from: supabase_create_events_table.sql
```

### Step 5: Final Verification
```sql
-- Check all core tables exist
SELECT 
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = table_name
  ) THEN '✅ Has RLS Policies' ELSE '❌ No RLS Policies' END as rls_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('workspaces', 'workspace_members', 'profiles', 'goals', 'projects', 'tasks', 'events')
ORDER BY table_name;
```

## 🚨 TROUBLESHOOTING

### Error: "relation does not exist"
**Cause:** Running scripts out of order  
**Solution:** Run foundational tables first, then dependencies

### Error: "violates row-level security policy"  
**Cause:** RLS fix not applied  
**Solution:** Run workspace RLS fix script

### Error: "column owner_id does not exist"
**Cause:** Workspace RLS fix not applied  
**Solution:** Run supabase_fix_workspace_rls_comprehensive.sql

### Error: "function is_workspace_member does not exist"
**Cause:** Foundational tables script not run  
**Solution:** Run supabase_create_foundational_tables.sql first

## 📞 SUPPORT

If you encounter issues:
1. Check the verification queries after each phase
2. Ensure scripts are run in the exact order specified
3. Check Supabase logs for detailed error messages
4. Verify you have appropriate permissions in Supabase

## 🎯 SUCCESS CRITERIA

Your database is ready when:
- ✅ All core tables exist with RLS enabled
- ✅ Workspace creation works without RLS errors
- ✅ New users get assigned to workspaces automatically
- ✅ All RLS policies are active and functional
- ✅ No "relation does not exist" errors

Once complete, you can proceed with integrating the WorkspaceService into your application code.
