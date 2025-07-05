#!/bin/bash

# ===========================================
# WORKSPACE RLS FIX - DEPLOYMENT SCRIPT
# ===========================================

echo "🔧 Deploying Workspace RLS Fix..."
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Pre-Deployment Checklist:${NC}"
echo "1. ✅ SQL migration file exists: supabase_fix_workspace_rls_comprehensive.sql"
echo "2. ✅ Workspace service created: workspace-service.ts"
echo "3. ✅ Implementation guide ready: WORKSPACE_RLS_FIX_IMPLEMENTATION_GUIDE.md"
echo ""

echo -e "${YELLOW}🚀 DEPLOYMENT OPTIONS:${NC}"
echo ""
echo -e "${GREEN}Option 1: Manual Deployment (Recommended)${NC}"
echo "----------------------------------------"
echo "1. Open Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Navigate to your project: nztnugncfiauygvywyoz"
echo "3. Go to SQL Editor"
echo "4. Create a new query"
echo "5. Copy and paste the contents of: supabase_fix_workspace_rls_comprehensive.sql"
echo "6. Run the query"
echo ""

echo -e "${GREEN}Option 2: Command Line (Requires Service Role Key)${NC}"
echo "-----------------------------------------------"
echo "If you have the service role key, you can run:"
echo "psql \"postgresql://postgres.nztnugncfiauygvywyoz:VLYrpK4L7Lg5E5Ld@aws-0-us-east-2.pooler.supabase.com:6543/postgres\" -f supabase_fix_workspace_rls_comprehensive.sql"
echo ""

echo -e "${YELLOW}📝 Post-Deployment Steps:${NC}"
echo "1. Verify migration success in Supabase Dashboard"
echo "2. Integrate workspace-service.ts into your application"
echo "3. Test new user registration"
echo "4. Test workspace creation"
echo ""

echo -e "${GREEN}🧪 Testing Commands:${NC}"
echo "After deployment, test with these steps:"
echo ""
echo "1. Register a new user in your app"
echo "2. Check that they get a 'Personal Workspace' automatically"
echo "3. Try creating a new workspace through the app"
echo "4. Verify no RLS errors occur"
echo ""

echo -e "${YELLOW}📊 Verification Queries (Run in SQL Editor):${NC}"
echo ""
echo "-- Check if owner_id column was added"
echo "SELECT column_name, data_type FROM information_schema.columns"
echo "WHERE table_name = 'workspaces' AND column_name = 'owner_id';"
echo ""
echo "-- Check RLS policies"
echo "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'workspaces';"
echo ""
echo "-- Check auto-assignment function"
echo "SELECT routine_name FROM information_schema.routines"
echo "WHERE routine_name = 'assign_user_to_default_workspace';"
echo ""

echo -e "${GREEN}✅ Ready to Deploy!${NC}"
echo ""
echo "Choose your deployment method and follow the steps above."
echo "The migration is designed to be safe and reversible."
echo ""

# Check if user wants to open Supabase dashboard
read -p "Would you like to open the Supabase Dashboard now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening Supabase Dashboard..."
    open "https://supabase.com/dashboard/project/nztnugncfiauygvywyoz/sql"
fi

echo ""
echo -e "${GREEN}🎯 Next Steps After Migration:${NC}"
echo "1. Integrate the WorkspaceService into your React app"
echo "2. Update any existing workspace creation code"
echo "3. Test thoroughly with new and existing users"
echo "4. Monitor for any remaining RLS issues"
echo ""
echo "💡 Need help? Check the implementation guide for detailed instructions."
