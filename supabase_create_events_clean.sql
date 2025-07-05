-- ===========================================
-- CLEAN EVENTS TABLE CREATION
-- ===========================================
-- This script safely removes any partial events table and recreates it

-- Drop events table if it exists (to clean up any partial creation)
DROP TABLE IF EXISTS public.events CASCADE;

-- Create events table fresh (workspaces table exists from Step 1)
CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    all_day boolean NOT NULL DEFAULT false,
    location text,
    event_type text NOT NULL DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'task', 'personal', 'reminder', 'deadline')),
    color text DEFAULT '#ffaa00',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_time_range CHECK (start_time <= end_time)
);

-- Create indexes for performance
CREATE INDEX idx_events_user_workspace ON public.events(user_id, workspace_id);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_end_time ON public.events(end_time);
CREATE INDEX idx_events_type ON public.events(event_type);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Allow workspace members to read events" 
ON public.events 
FOR SELECT 
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Allow members to create their own events" 
ON public.events 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Allow members to update their own events" 
ON public.events 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow members to delete their own events" 
ON public.events 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function for date range queries
CREATE OR REPLACE FUNCTION get_user_events_for_range(
    p_user_id uuid,
    p_workspace_id uuid,
    p_start_date timestamp with time zone,
    p_end_date timestamp with time zone
) RETURNS TABLE (
    id uuid,
    title text,
    description text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    all_day boolean,
    location text,
    event_type text,
    color text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.start_time,
        e.end_time,
        e.all_day,
        e.location,
        e.event_type,
        e.color,
        e.created_at,
        e.updated_at
    FROM public.events e
    WHERE e.user_id = p_user_id 
        AND e.workspace_id = p_workspace_id
        AND (
            (e.start_time >= p_start_date AND e.start_time < p_end_date) OR
            (e.end_time > p_start_date AND e.end_time <= p_end_date) OR
            (e.start_time <= p_start_date AND e.end_time >= p_end_date)
        )
    ORDER BY e.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
SELECT 'Events table created successfully!' as status;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'events'
ORDER BY ordinal_position;
