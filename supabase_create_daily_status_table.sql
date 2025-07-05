-- This script creates the daily_status table, an ENUM type for energy levels,
-- and sets up a trigger to automatically update the updated_at timestamp.

-- 1. Create an ENUM type for energy levels for better data integrity.
CREATE TYPE public.energy_level_enum AS ENUM ('low', 'medium', 'high');

-- 2. Create the daily_status table
CREATE TABLE public.daily_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date date NOT NULL,
  energy_level public.energy_level_enum NOT NULL,
  main_focus text,
  heads_up text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- A user can only have one status per day in a given workspace.
  CONSTRAINT daily_status_user_workspace_date_unique UNIQUE (user_id, workspace_id, date)
);

-- 3. Set up a trigger to automatically update the `updated_at` column on any change.
-- This is a common best practice for tracking when records were last modified.
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_daily_status_updated
BEFORE UPDATE ON public.daily_status
FOR EACH ROW
EXECUTE PROCEDURE handle_updated_at();

-- After running this, you can run the RLS policies from the other file.
