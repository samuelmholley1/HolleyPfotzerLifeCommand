-- ===========================================
-- UPDATE EVENTS TABLE - ADD PROJECT_ID
-- ===========================================
-- This script adds project_id column to existing events table

-- Add project_id column to events table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.events 
        ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
        
        -- Create index for the new column
        CREATE INDEX idx_events_project ON public.events(project_id);
        
        RAISE NOTICE 'Added project_id column to events table';
    ELSE
        RAISE NOTICE 'project_id column already exists in events table';
    END IF;
END $$;

-- Verification
SELECT 'Events table updated with project_id!' as status;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'project_id';
