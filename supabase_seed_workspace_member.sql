-- This script assigns the first user found to the first workspace found.
-- This is useful for seeding initial data in a development environment.

DO $$
DECLARE
    user_id_to_assign uuid;
    workspace_id_to_assign uuid;
BEGIN
    -- Get the first user from auth.users
    SELECT id INTO user_id_to_assign FROM auth.users LIMIT 1;

    -- Get the first workspace
    SELECT id INTO workspace_id_to_assign FROM public.workspaces LIMIT 1;

    -- Check if the user is already a member of the workspace
    IF EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id = user_id_to_assign AND workspace_id = workspace_id_to_assign) THEN
        RAISE NOTICE 'User % is already a member of workspace %.', user_id_to_assign, workspace_id_to_assign;
    ELSE
        -- If both a user and a workspace exist, create the membership
        IF user_id_to_assign IS NOT NULL AND workspace_id_to_assign IS NOT NULL THEN
            INSERT INTO public.workspace_members (user_id, workspace_id)
            VALUES (user_id_to_assign, workspace_id_to_assign);

            RAISE NOTICE 'Assigned user % to workspace %.', user_id_to_assign, workspace_id_to_assign;
        ELSE
            RAISE WARNING 'Could not find a user or workspace to create the initial membership.';
        END IF;
    END IF;
END;
$$;
