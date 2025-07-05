-- Complete Missing Tables Migration - Safe to run multiple times
-- Creates tasks table and ensures communication_modes table exists with proper structure

-- Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication Modes Table (ensure it exists with proper structure)
CREATE TABLE IF NOT EXISTS public.communication_modes (
    workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    current_mode TEXT NOT NULL DEFAULT 'normal' CHECK (current_mode IN ('normal', 'careful', 'emergency_break', 'mediated')),
    timeout_end TIMESTAMP WITH TIME ZONE,
    last_break_timestamp TIMESTAMP WITH TIME ZONE,
    break_count_today INTEGER NOT NULL DEFAULT 0,
    partner_acknowledged BOOLEAN NOT NULL DEFAULT false,
    active_topic TEXT,
    paused_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_modes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (now safe because tables exist)
DROP POLICY IF EXISTS "Users can read tasks in their workspaces" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks in their workspaces" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their workspaces" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their workspaces" ON public.tasks;
DROP POLICY IF EXISTS "Users can read communication modes in their workspaces" ON public.communication_modes;
DROP POLICY IF EXISTS "Users can modify communication modes in their workspaces" ON public.communication_modes;

-- Tasks RLS Policies
CREATE POLICY "Users can read tasks in their workspaces" ON public.tasks
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks in their workspaces" ON public.tasks
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks in their workspaces" ON public.tasks
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks in their workspaces" ON public.tasks
    FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Communication Modes RLS Policies
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

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status 
    ON public.tasks(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_user_created 
    ON public.tasks(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
    ON public.tasks(due_date) WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to 
    ON public.tasks(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_communication_modes_workspace 
    ON public.communication_modes(workspace_id);

-- Create Functions for Tasks
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_communication_mode_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Triggers
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_updated_at();

DROP TRIGGER IF EXISTS update_communication_modes_updated_at ON public.communication_modes;
CREATE TRIGGER update_communication_modes_updated_at
    BEFORE UPDATE ON public.communication_modes
    FOR EACH ROW
    EXECUTE FUNCTION update_communication_mode_updated_at();

-- Grant Permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.communication_modes TO authenticated;

-- Insert default communication mode for existing workspaces (if any)
INSERT INTO public.communication_modes (workspace_id, current_mode, break_count_today, partner_acknowledged)
SELECT id, 'normal', 0, false
FROM public.workspaces
WHERE id NOT IN (SELECT workspace_id FROM public.communication_modes)
ON CONFLICT (workspace_id) DO NOTHING;
