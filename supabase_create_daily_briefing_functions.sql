-- ===========================================
-- CREATE DAILY BRIEFING FUNCTIONS
-- ===========================================
-- Functions for retrieving daily briefing data

BEGIN;

-- Create the get_daily_briefing_members function
CREATE OR REPLACE FUNCTION public.get_daily_briefing_members(p_workspace_id UUID)
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    avatar_url TEXT,
    email TEXT,
    role TEXT,
    last_activity TIMESTAMP WITH TIME ZONE,
    status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify the requesting user is a member of the workspace
    IF NOT EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = p_workspace_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: User is not a member of this workspace';
    END IF;
    
    -- Return workspace members with their profile information and status
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.full_name AS name,
        p.avatar_url,
        p.email,
        wm.role,
        COALESCE(
            (SELECT MAX(created_at) FROM events WHERE user_id = p.id AND workspace_id = p_workspace_id),
            wm.created_at
        ) AS last_activity,
        COALESCE(
            (SELECT status FROM user_status WHERE user_id = p.id AND workspace_id = p_workspace_id ORDER BY updated_at DESC LIMIT 1),
            'unknown'
        ) AS status
    FROM 
        workspace_members wm
    JOIN 
        profiles p ON p.id = wm.user_id
    WHERE 
        wm.workspace_id = p_workspace_id
    ORDER BY 
        p.full_name;
    
END;
$$;

-- Create table for user status if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, workspace_id)
);

-- Enable RLS on the user_status table
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

-- Create policies for user_status
CREATE POLICY "Users can read status in their workspace" ON public.user_status
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = user_status.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own status" ON public.user_status
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own status" ON public.user_status
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own status" ON public.user_status
    FOR DELETE
    USING (user_id = auth.uid());

-- Create communication_modes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.communication_modes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(workspace_id, name)
);

-- Enable RLS on the communication_modes table
ALTER TABLE public.communication_modes ENABLE ROW LEVEL SECURITY;

-- Create policies for communication_modes
CREATE POLICY "Users can read communication modes in their workspace" ON public.communication_modes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = communication_modes.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage communication modes" ON public.communication_modes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = communication_modes.workspace_id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = communication_modes.workspace_id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role IN ('owner', 'admin')
        )
    );

-- Create debug_loops table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.debug_loops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on the debug_loops table
ALTER TABLE public.debug_loops ENABLE ROW LEVEL SECURITY;

-- Create policies for debug_loops
CREATE POLICY "Users can read debug loops in their workspace" ON public.debug_loops
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = debug_loops.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create debug loops in their workspace" ON public.debug_loops
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = debug_loops.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can update their own debug loops" ON public.debug_loops
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any debug loops" ON public.debug_loops
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = debug_loops.workspace_id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = debug_loops.workspace_id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role IN ('owner', 'admin')
        )
    );

COMMIT;
