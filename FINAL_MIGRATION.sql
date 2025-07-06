-- Final Migration: Create Tasks Table and Ensure Communication Modes Columns
-- Run this script in Supabase SQL Editor to complete the database setup

-- 1. CREATE TASKS TABLE
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

-- 2. ADD MISSING COLUMNS TO COMMUNICATION_MODES TABLE
DO $$
BEGIN
    -- Check and add current_mode column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communication_modes' 
                   AND column_name = 'current_mode') THEN
        ALTER TABLE public.communication_modes 
        ADD COLUMN current_mode TEXT DEFAULT 'normal' 
        CHECK (current_mode IN ('normal', 'careful', 'emergency_break', 'mediated'));
    END IF;

    -- Check and add timeout_end column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communication_modes' 
                   AND column_name = 'timeout_end') THEN
        ALTER TABLE public.communication_modes 
        ADD COLUMN timeout_end TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Check and add last_break_timestamp column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communication_modes' 
                   AND column_name = 'last_break_timestamp') THEN
        ALTER TABLE public.communication_modes 
        ADD COLUMN last_break_timestamp TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Check and add break_count_today column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communication_modes' 
                   AND column_name = 'break_count_today') THEN
        ALTER TABLE public.communication_modes 
        ADD COLUMN break_count_today INTEGER DEFAULT 0;
    END IF;

    -- Check and add partner_acknowledged column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communication_modes' 
                   AND column_name = 'partner_acknowledged') THEN
        ALTER TABLE public.communication_modes 
        ADD COLUMN partner_acknowledged BOOLEAN DEFAULT false;
    END IF;

    -- Check and add active_topic column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communication_modes' 
                   AND column_name = 'active_topic') THEN
        ALTER TABLE public.communication_modes 
        ADD COLUMN active_topic TEXT;
    END IF;

    -- Check and add paused_until column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communication_modes' 
                   AND column_name = 'paused_until') THEN
        ALTER TABLE public.communication_modes 
        ADD COLUMN paused_until TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Check and add created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communication_modes' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.communication_modes 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Check and add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communication_modes' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.communication_modes 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_modes ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES FOR TASKS
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

-- 5. ENSURE RLS POLICIES FOR COMMUNICATION_MODES
DROP POLICY IF EXISTS "Users can read communication modes in their workspaces" ON public.communication_modes;
DROP POLICY IF EXISTS "Users can modify communication modes in their workspaces" ON public.communication_modes;

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

-- 6. CREATE INDEXES FOR PERFORMANCE
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

-- 7. CREATE FUNCTIONS FOR AUTO-UPDATING TIMESTAMPS
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

-- 8. CREATE TRIGGERS
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

-- 9. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.communication_modes TO authenticated;

-- 10. UPDATE EXISTING ROWS WITH DEFAULT VALUES
UPDATE public.communication_modes 
SET 
    current_mode = COALESCE(current_mode, 'normal'),
    break_count_today = COALESCE(break_count_today, 0),
    partner_acknowledged = COALESCE(partner_acknowledged, false),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE current_mode IS NULL 
   OR break_count_today IS NULL 
   OR partner_acknowledged IS NULL 
   OR created_at IS NULL 
   OR updated_at IS NULL;

-- SUCCESS MESSAGE
SELECT 'Migration completed successfully! Tasks table created and communication_modes table updated.' AS result;
