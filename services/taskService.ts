import { supabase } from '../lib/supabase';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, TaskStats, RecurrenceRule, CrossLink } from '../types/tasks';
import { logger } from '../lib/logging';

export class TaskService {
  /**
   * Fetch all tasks for a user in a specific workspace
   */
  static async getTasks(
    userId: string, 
    workspaceId: string, 
    filters?: TaskFilters
  ): Promise<Task[]> {
    try {
      logger.info('TASKS', 'Fetching tasks', { userId, workspaceId, filters });
      
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }
      if (filters?.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('TASKS', 'Error fetching tasks', { error: error.message, userId, workspaceId });
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }

      logger.info('TASKS', 'Tasks fetched successfully', { 
        count: data?.length || 0, 
        userId, 
        workspaceId 
      });
      
      return data || [];
    } catch (error) {
      logger.error('TASKS', 'Unexpected error fetching tasks', { error, userId, workspaceId });
      throw error;
    }
  }

  /**
   * Create a new task
   */
  static async createTask(
    userId: string,
    workspaceId: string,
    taskData: CreateTaskInput
  ): Promise<Task> {
    try {
      logger.info('TASKS', 'Creating task', { userId, workspaceId, taskData });

      const newTask = {
        user_id: userId,
        workspace_id: workspaceId,
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || null,
        completed: false,
        recurrence: taskData.recurrence ? JSON.stringify(taskData.recurrence) : null,
        cross_links: taskData.cross_links ? JSON.stringify(taskData.cross_links) : null,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        logger.error('TASKS', 'Error creating task', { 
          error: error.message, 
          userId, 
          workspaceId, 
          taskData 
        });
        throw new Error(`Failed to create task: ${error.message}`);
      }

      logger.info('TASKS', 'Task created successfully', { 
        taskId: data.id, 
        userId, 
        workspaceId 
      });
      
      return data;
    } catch (error) {
      logger.error('TASKS', 'Unexpected error creating task', { error, userId, workspaceId, taskData });
      throw error;
    }
  }

  /**
   * MVP: Fetch all tasks (no user/workspace filter)
   */
  static async getTasksSimple(): Promise<any[]> {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    return data || [];
  }

  /**
   * MVP: Create a task with flexible fields, storing unknowns in 'extra'
   */
  static async createTaskSimple(taskData: Record<string, any>): Promise<any> {
    const DEFAULTS: { [key: string]: any } = { status: 'pending' };
    const knownColumns = [
      'id', 'workspace_id', 'title', 'status', 'priority', 'created_at', 'updated_at', 'slug', 'extra'
    ];
    const merged: { [key: string]: any } = { ...DEFAULTS, ...taskData };
    const task: { [key: string]: any } = {};
    const extra: { [key: string]: any } = {};
    for (const key in merged) {
      if (knownColumns.includes(key)) {
        task[key] = merged[key];
      } else {
        extra[key] = merged[key];
      }
    }
    if (Object.keys(extra).length > 0) {
      task.extra = extra;
    }
    const { data, error } = await supabase.from('tasks').insert([task]).select().single();
    if (error) throw error;
    return data;
  }

  /**
   * Update an existing task
   */
  static async updateTask(
    userId: string,
    taskId: string,
    updates: UpdateTaskInput
  ): Promise<Task> {
    try {
      logger.info('TASKS', 'Updating task', { userId, taskId, updates });

      // Prepare updates for recurrence/cross_links
      const updatesToSend: any = { ...updates };
      if (updates.recurrence !== undefined) {
        updatesToSend.recurrence = updates.recurrence ? JSON.stringify(updates.recurrence) : null;
      }
      if (updates.cross_links !== undefined) {
        updatesToSend.cross_links = updates.cross_links ? JSON.stringify(updates.cross_links) : null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updatesToSend)
        .eq('id', taskId)
        .eq('user_id', userId) // Ensure user can only update their own tasks
        .select()
        .single();

      if (error) {
        logger.error('TASKS', 'Error updating task', { 
          error: error.message, 
          userId, 
          taskId, 
          updates 
        });
        throw new Error(`Failed to update task: ${error.message}`);
      }

      if (!data) {
        logger.warn('TASKS', 'Task not found or not authorized', { userId, taskId });
        throw new Error('Task not found or you are not authorized to update it');
      }

      logger.info('TASKS', 'Task updated successfully', { taskId, userId });
      
      return data;
    } catch (error) {
      logger.error('TASKS', 'Unexpected error updating task', { error, userId, taskId, updates });
      throw error;
    }
  }

  /**
   * Delete a task
   */
  static async deleteTask(userId: string, taskId: string): Promise<void> {
    try {
      logger.info('TASKS', 'Deleting task', { userId, taskId });

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId); // Ensure user can only delete their own tasks

      if (error) {
        logger.error('TASKS', 'Error deleting task', { 
          error: error.message, 
          userId, 
          taskId 
        });
        throw new Error(`Failed to delete task: ${error.message}`);
      }

      logger.info('TASKS', 'Task deleted successfully', { taskId, userId });
    } catch (error) {
      logger.error('TASKS', 'Unexpected error deleting task', { error, userId, taskId });
      throw error;
    }
  }

  /**
   * Toggle task completion status
   */
  static async toggleTask(userId: string, taskId: string): Promise<Task> {
    try {
      logger.info('TASKS', 'Toggling task completion', { userId, taskId });

      // First, get the current task to know its completion status
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('completed')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !currentTask) {
        logger.error('TASKS', 'Error fetching task for toggle', { 
          error: fetchError?.message, 
          userId, 
          taskId 
        });
        throw new Error('Task not found or you are not authorized to update it');
      }

      // Toggle the completion status
      const newCompletedStatus = !currentTask.completed;

      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: newCompletedStatus })
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('TASKS', 'Error toggling task', { 
          error: error.message, 
          userId, 
          taskId 
        });
        throw new Error(`Failed to toggle task: ${error.message}`);
      }

      logger.info('TASKS', 'Task toggled successfully', { 
        taskId, 
        userId, 
        newStatus: newCompletedStatus 
      });
      
      return data;
    } catch (error) {
      logger.error('TASKS', 'Unexpected error toggling task', { error, userId, taskId });
      throw error;
    }
  }

  /**
   * Get task statistics for a user in a workspace
   */
  static async getTaskStats(userId: string, workspaceId: string): Promise<TaskStats> {
    try {
      logger.info('TASKS', 'Fetching task stats', { userId, workspaceId });

      const { data, error } = await supabase
        .from('tasks')
        .select('completed, priority, due_date')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId);

      if (error) {
        logger.error('TASKS', 'Error fetching task stats', { 
          error: error.message, 
          userId, 
          workspaceId 
        });
        throw new Error(`Failed to fetch task stats: ${error.message}`);
      }

      const tasks = data || [];
      const now = new Date();

      const stats: TaskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        pending: tasks.filter(t => !t.completed).length,
        overdue: tasks.filter(t => 
          !t.completed && 
          t.due_date && 
          new Date(t.due_date) < now
        ).length,
        high_priority: tasks.filter(t => t.priority === 'high').length,
        medium_priority: tasks.filter(t => t.priority === 'medium').length,
        low_priority: tasks.filter(t => t.priority === 'low').length,
      };

      logger.info('TASKS', 'Task stats calculated', { stats, userId, workspaceId });
      
      return stats;
    } catch (error) {
      logger.error('TASKS', 'Unexpected error fetching task stats', { error, userId, workspaceId });
      throw error;
    }
  }
}
