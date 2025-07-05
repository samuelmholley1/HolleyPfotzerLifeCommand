-- This script adds a foreign key constraint to the workspace_members table.

ALTER TABLE public.workspace_members
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
