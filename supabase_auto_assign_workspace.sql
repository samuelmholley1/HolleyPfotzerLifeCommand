-- Function to automatically assign new users to a default workspace
-- and set their active_workspace_id in their profile

CREATE OR REPLACE FUNCTION assign_user_to_default_workspace()
RETURNS TRIGGER AS $$
DECLARE
    default_workspace_id uuid;
    workspace_name text := 'Personal Workspace';
BEGIN
    -- Try to find an existing default workspace
    SELECT id INTO default_workspace_id 
    FROM public.workspaces 
    WHERE name = workspace_name 
    LIMIT 1;
    
    -- If no default workspace exists, create one
    IF default_workspace_id IS NULL THEN
        INSERT INTO public.workspaces (name, description, created_at, updated_at)
        VALUES (
            workspace_name,
            'Default personal workspace for productivity tracking',
            NOW(),
            NOW()
        )
        RETURNING id INTO default_workspace_id;
        
        RAISE NOTICE 'Created default workspace: %', default_workspace_id;
    END IF;
    
    -- Add user to the workspace
    INSERT INTO public.workspace_members (user_id, workspace_id, created_at)
    VALUES (NEW.id, default_workspace_id, NOW())
    ON CONFLICT (user_id, workspace_id) DO NOTHING;
    
    -- Create/update the user's profile with the active workspace
    INSERT INTO public.profiles (id, full_name, avatar_url, active_workspace_id, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        default_workspace_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        active_workspace_id = default_workspace_id,
        full_name = COALESCE(
            profiles.full_name, 
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        ),
        avatar_url = COALESCE(
            profiles.avatar_url,
            NEW.raw_user_meta_data->>'avatar_url'
        ),
        updated_at = NOW();
    
    RAISE NOTICE 'Assigned user % to workspace % and updated profile', NEW.id, default_workspace_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
