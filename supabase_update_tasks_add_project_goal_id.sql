-- ===========================================
-- UPDATE TASKS TABLE - ADD PROJECT_ID AND GOAL_ID
-- ===========================================
-- This script adds project_id and goal_id columns to existing tasks table

-- Add project_id column to tasks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
        
        -- Create index for the new column
        CREATE INDEX idx_tasks_project ON public.tasks(project_id);
        
        RAISE NOTICE 'Added project_id column to tasks table';
    ELSE
        RAISE NOTICE 'project_id column already exists in tasks table';
    END IF;
END $$;

-- Add goal_id column to tasks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'goal_id'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;
        
        -- Create index for the new column
        CREATE INDEX idx_tasks_goal ON public.tasks(goal_id);
        
        RAISE NOTICE 'Added goal_id column to tasks table';
    ELSE
        RAISE NOTICE 'goal_id column already exists in tasks table';
    END IF;
END $$;

-- Verification
SELECT 'Tasks table updated with project_id and goal_id!' as status;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'tasks' 
AND column_name IN ('project_id', 'goal_id')
ORDER BY column_name;
