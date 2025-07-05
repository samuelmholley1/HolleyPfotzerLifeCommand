-- Add Missing Columns to communication_modes Table
-- This script safely adds columns that might be missing from communication_modes table

-- Add missing columns if they don't exist
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
