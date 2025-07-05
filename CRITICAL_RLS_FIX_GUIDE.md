# 🚨 CRITICAL FIX: Supabase RLS Policies for Profiles Table

## Issue Summary
The app is experiencing 403 Forbidden errors when trying to upsert user profiles because the `profiles` table is missing the required RLS (Row Level Security) policies for INSERT operations.

**Error:** `"new row violates row-level security policy for table \"profiles\""`

## 🔧 Required Fix

### Step 1: Apply the RLS Policy Fix
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the contents of `supabase_fix_profiles_rls.sql`

This will:
- ✅ Enable RLS on the profiles table
- ✅ Add INSERT policy (critical for upserts)
- ✅ Add UPDATE policy (critical for upserts)
- ✅ Add SELECT and DELETE policies for completeness
- ✅ Include verification queries

### Step 2: Optional Database Enhancements
After fixing the RLS policies, you may also want to run these additional scripts:

1. **Auto-assign workspaces to users:**
   ```sql
   -- Run supabase_auto_assign_workspace.sql
   ```

2. **Create trigger for new users:**
   ```sql
   -- Run supabase_create_user_trigger.sql
   ```

## 🧪 Testing the Fix

After applying the RLS fix, test in your app:

1. **Sign in to the app**
2. **Check browser console** - should see:
   ```
   ✅ User has workspace assigned
   ✅ Profile updated successfully
   ```
3. **Verify tabs work** - Tasks and Events tabs should load without errors
4. **Check Daily Briefing** - Should display user's workspace information

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify the fix:

```sql
-- 1. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 2. List all policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Test profile access (when authenticated)
SELECT id, full_name, active_workspace_id 
FROM profiles 
WHERE id = auth.uid();
```

## 🚫 Before the Fix
- ❌ Users cannot upsert profiles (403 error)
- ❌ Workspace assignment fails
- ❌ App shows loading states indefinitely
- ❌ Console shows RLS policy violations

## ✅ After the Fix
- ✅ Users can upsert their own profiles
- ✅ Workspace assignment works
- ✅ App loads completely
- ✅ All tabs function properly

## 🛡️ Security Notes

The RLS policies ensure:
- Users can only access their own profile data
- No user can read/modify another user's profile
- Authenticated users can create/update their own profile
- Proper isolation between user accounts

## 📋 Next Steps After Fix

1. **Deploy the RLS fix** (highest priority)
2. **Test user onboarding flow**
3. **Implement full Tasks/Events functionality**
4. **Add comprehensive error handling**
5. **Performance optimization**

---

**Priority Level:** 🔥 CRITICAL - App is non-functional without this fix
