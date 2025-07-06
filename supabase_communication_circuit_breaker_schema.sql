-- Communication Circuit Breaker Database Schema
-- This schema supports the anti-debugging circuit functionality

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

-- Communication Mode Table (per workspace)
CREATE TABLE IF NOT EXISTS public.communication_modes (
    workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    current_mode TEXT NOT NULL DEFAULT 'normal' CHECK (current_mode IN ('normal', 'careful', 'emergency_break', 'mediated')),
    timeout_end TIMESTAMP WITH TIME ZONE,
    last_break_timestamp TIMESTAMP WITH TIME ZONE,
    break_count_today INTEGER NOT NULL DEFAULT 0,
    partner_acknowledged BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Capacity Status Table (per user per day)
CREATE TABLE IF NOT EXISTS public.capacity_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    cognitive_capacity TEXT NOT NULL CHECK (cognitive_capacity IN ('high', 'medium', 'low', 'overloaded')),
    communication_preference TEXT NOT NULL CHECK (communication_preference IN ('direct', 'gentle', 'minimal')),
    trigger_sensitivity TEXT NOT NULL CHECK (trigger_sensitivity IN ('low', 'medium', 'high')),
    last_debugging_circuit TIMESTAMP WITH TIME ZONE,
    circuit_breaks_today INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, workspace_id, date)
);

-- Debug Loops Table (tracks debugging circuit occurrences)
CREATE TABLE IF NOT EXISTS public.debug_loops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    participants UUID[] NOT NULL, -- Array of user IDs
    trigger_event TEXT NOT NULL,
    loop_indicators TEXT[] NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    resolution_method TEXT CHECK (resolution_method IN ('emergency_break', 'clarification', 'timeout', 'natural')),
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security Policies

-- Communication Events RLS
ALTER TABLE public.communication_events ENABLE ROW LEVEL SECURITY;

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

-- Communication Modes RLS
ALTER TABLE public.communication_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read communication modes in their workspaces" ON public.communication_modes
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can modify communication modes in their workspaces" ON public.communication_modes
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Capacity Status RLS
ALTER TABLE public.capacity_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read capacity status in their workspaces" ON public.capacity_status
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own capacity status" ON public.capacity_status
    FOR ALL USING (user_id = auth.uid());

-- Debug Loops RLS
ALTER TABLE public.debug_loops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read debug loops in their workspaces" ON public.debug_loops
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create debug loops in their workspaces" ON public.debug_loops
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update debug loops in their workspaces" ON public.debug_loops
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_events_workspace_created 
    ON public.communication_events(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_communication_events_user_type 
    ON public.communication_events(user_id, event_type);

CREATE INDEX IF NOT EXISTS idx_capacity_status_user_date 
    ON public.capacity_status(user_id, workspace_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_debug_loops_workspace_created 
    ON public.debug_loops(workspace_id, created_at DESC);

-- Reset break count daily (function to be called by cron)
CREATE OR REPLACE FUNCTION reset_daily_break_counts()
RETURNS void AS $$
BEGIN
    UPDATE public.communication_modes 
    SET break_count_today = 0
    WHERE DATE(last_break_timestamp) < CURRENT_DATE;
    
    UPDATE public.capacity_status 
    SET circuit_breaks_today = 0
    WHERE date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.communication_events TO authenticated;
GRANT ALL ON public.communication_modes TO authenticated;
GRANT ALL ON public.capacity_status TO authenticated;
GRANT ALL ON public.debug_loops TO authenticated;
