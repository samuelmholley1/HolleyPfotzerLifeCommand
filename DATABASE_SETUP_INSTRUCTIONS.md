🚨 MANUAL DATABASE SETUP REQUIRED
=====================================

STEP 1: Create Missing Communication Tables
-------------------------------------------
1. Go to: https://supabase.com/dashboard/project/nztnugncfiauygvywyoz/sql
2. Copy the SQL below and paste it into the SQL editor
3. Click "Run" to execute

-- Missing Communication Tables SQL:
```sql
-- Communication Events Table
CREATE TABLE IF NOT EXISTS public.communication_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('assumption_clarification', 'emergency_break', 'timeout_request', 'mediated_discussion')),
    content JSONB NOT NULL DEFAULT '{}',
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Capacity Status Table (per user per day)
CREATE TABLE IF NOT EXISTS public.capacity_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    cognitive_capacity TEXT NOT NULL DEFAULT 'medium' CHECK (cognitive_capacity IN ('high', 'medium', 'low', 'overloaded')),
    communication_preference TEXT NOT NULL DEFAULT 'direct' CHECK (communication_preference IN ('direct', 'gentle', 'minimal')),
    trigger_sensitivity TEXT NOT NULL DEFAULT 'medium' CHECK (trigger_sensitivity IN ('low', 'medium', 'high')),
    last_debugging_circuit TIMESTAMP WITH TIME ZONE,
    circuit_breaks_today INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, workspace_id, date)
);

-- Row Level Security Policies
ALTER TABLE public.communication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_status ENABLE ROW LEVEL SECURITY;

-- Communication Events RLS
CREATE POLICY "Users can read communication events in their workspaces" ON public.communication_events
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create communication events in their workspaces" ON public.communication_events
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        ) AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own communication events" ON public.communication_events
    FOR UPDATE USING (user_id = auth.uid());

-- Capacity Status RLS
CREATE POLICY "Users can read capacity status in their workspaces" ON public.capacity_status
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own capacity status" ON public.capacity_status
    FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_events_workspace_created 
    ON public.communication_events(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_communication_events_user_type 
    ON public.communication_events(user_id, event_type);

CREATE INDEX IF NOT EXISTS idx_capacity_status_user_date 
    ON public.capacity_status(user_id, workspace_id, date DESC);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.communication_events TO authenticated;
GRANT ALL ON public.capacity_status TO authenticated;
```

STEP 2: Verify Database Setup
-----------------------------
After running the SQL, execute this command to verify:
```bash
node test_communication_tables.js
```

All tables should show ✅ when setup is complete.

STEP 3: Test the Implementation
-------------------------------
The app is running at: http://localhost:3000
- Emergency break button should be visible
- Communication status bar should show current mode
- Real-time updates should work between browser tabs
