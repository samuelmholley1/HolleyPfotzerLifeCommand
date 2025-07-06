import { createClient } from '../lib/supabase/client';
import { Task } from '../types/tasks';
import { Database } from '@/supabase';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

// Define the shape of the data needed to create a task.
// This makes our function calls type-safe and explicit.
// We only need the title and workspaceId to create a basic task.
export type CreateTaskPayload = Pick<Task, 'title' | 'workspaceId'>;

export const taskService = {
  /**
   * Fetches all tasks for a given workspace.
   * @param workspaceId The UUID of the workspace to fetch tasks from.
   */
  getTasks: async (workspaceId: string): Promise<Task[]> => {
    const supabase = createClient();
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*') // Selects all columns
      .eq('workspace_id', workspaceId) // Filters by the provided workspace ID
      .order('created_at', { ascending: false }); // Show newest tasks first

    if (error) {
      console.error('Error fetching tasks:', error.message);
      throw new Error('Failed to fetch tasks from the database.');
    }

    return tasks || [];
  },

  /**
   * Creates a new task.
   * @param payload An object containing the required data to create a task.
   */
  createTask: async (payload: CreateTaskPayload): Promise<Task> => {
    const supabase = createClient();
    // The user_id is automatically set by the database (DEFAULT auth.uid()).
    // We only need to provide the required fields from our payload.
    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select() // Return the newly created record
      .single(); // Expect only one record to be returned

    if (error) {
      console.error('Error creating task:', error.message);
      throw new Error('Failed to create the task in the database.');
    }
    
    if (!newTask) {
      throw new Error('Task creation did not return the new task.');
    }

    return newTask;
  },
};
