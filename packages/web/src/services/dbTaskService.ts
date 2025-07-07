import { createClient } from '@supabase/supabase-js';
import { Task, CreateTaskInput } from '@/types/tasks';
import { AuthUser } from '@/types/auth';
import { Database } from '@/types/supabase';

// Initialize Supabase client (assumes env vars are set)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const dbTaskService = {
  /**
   * Create a new task for the authenticated user in their active workspace.
   * @param {CreateTaskInput} data - Task data
   * @param {AuthUser} user - Authenticated user
   * @returns {Promise<Task>}
   */
  async createTask(data: CreateTaskInput, user: AuthUser): Promise<Task> {
    if (!user || !user.id || !user.active_workspace_id) {
      throw new Error('User not authenticated or missing workspace context');
    }
    const { title, description, priority } = data;
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          description,
          priority,
          user_id: user.id,
          workspace_id: user.active_workspace_id,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return task as Task;
  },

  /**
   * Get all tasks for the authenticated user's active workspace.
   * @param {AuthUser} user - Authenticated user
   * @returns {Promise<Task[]>}
   */
  async getTasks(user: AuthUser): Promise<Task[]> {
    if (!user || !user.id || !user.active_workspace_id) {
      throw new Error('User not authenticated or missing workspace context');
    }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', user.active_workspace_id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Task[];
  },
};
