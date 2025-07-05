import { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, TaskStats } from '../types/tasks';
import { TaskService } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';
import { useUserWorkspace } from './useUserWorkspace';
import { logger } from '../lib/logging';

export interface UseTasksReturn {
  tasks: Task[];
  stats: TaskStats | null;
  loading: boolean;
  error: string | null;
  createTask: (taskData: CreateTaskInput) => Promise<Task | null>;
  updateTask: (taskId: string, updates: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  toggleTask: (taskId: string) => Promise<boolean>;
  refreshTasks: () => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
  filters: TaskFilters;
}

export function useTasks(): UseTasksReturn {
  const { user } = useAuth();
  const { workspaceId } = useUserWorkspace();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});

  // Fetch tasks from the server
  const fetchTasks = useCallback(async () => {
    if (!user?.id || !workspaceId) {
      logger.info('TASKS_HOOK', 'Cannot fetch tasks: missing user or workspace', {
        hasUser: !!user?.id,
        hasWorkspace: !!workspaceId
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('TASKS_HOOK', 'Fetching tasks', { 
        userId: user.id, 
        workspaceId: workspaceId,
        filters 
      });

      const [tasksData, statsData] = await Promise.all([
        TaskService.getTasks(user.id, workspaceId, filters),
        TaskService.getTaskStats(user.id, workspaceId)
      ]);

      setTasks(tasksData);
      setStats(statsData);
      
      logger.info('TASKS_HOOK', 'Tasks and stats fetched successfully', {
        taskCount: tasksData.length,
        stats: statsData
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      logger.error('TASKS_HOOK', 'Error fetching tasks', { error: err });
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspaceId, filters]);

  // Create a new task
  const createTask = useCallback(async (taskData: CreateTaskInput): Promise<Task | null> => {
    if (!user?.id || !workspaceId) {
      setError('Cannot create task: missing user or workspace');
      return null;
    }

    try {
      setError(null);
      logger.info('TASKS_HOOK', 'Creating task', { taskData });

      const newTask = await TaskService.createTask(user.id, workspaceId, taskData);
      
      // Add to local state
      setTasks(prevTasks => [newTask, ...prevTasks]);
      
      // Refresh stats
      const newStats = await TaskService.getTaskStats(user.id, workspaceId);
      setStats(newStats);

      logger.info('TASKS_HOOK', 'Task created successfully', { taskId: newTask.id });
      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      logger.error('TASKS_HOOK', 'Error creating task', { error: err });
      return null;
    }
  }, [user?.id, workspaceId]);

  // Update an existing task
  const updateTask = useCallback(async (taskId: string, updates: UpdateTaskInput): Promise<Task | null> => {
    if (!user?.id) {
      setError('Cannot update task: missing user');
      return null;
    }

    try {
      setError(null);
      logger.info('TASKS_HOOK', 'Updating task', { taskId, updates });

      const updatedTask = await TaskService.updateTask(user.id, taskId, updates);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === taskId ? updatedTask : task)
      );

      // Refresh stats if completion status changed
      if (updates.completed !== undefined && workspaceId) {
        const newStats = await TaskService.getTaskStats(user.id, workspaceId);
        setStats(newStats);
      }

      logger.info('TASKS_HOOK', 'Task updated successfully', { taskId });
      return updatedTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      logger.error('TASKS_HOOK', 'Error updating task', { error: err });
      return null;
    }
  }, [user?.id, workspaceId]);

  // Delete a task
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Cannot delete task: missing user');
      return false;
    }

    try {
      setError(null);
      logger.info('TASKS_HOOK', 'Deleting task', { taskId });

      await TaskService.deleteTask(user.id, taskId);
      
      // Remove from local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      // Refresh stats
      if (workspaceId) {
        const newStats = await TaskService.getTaskStats(user.id, workspaceId);
        setStats(newStats);
      }

      logger.info('TASKS_HOOK', 'Task deleted successfully', { taskId });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      logger.error('TASKS_HOOK', 'Error deleting task', { error: err });
      return false;
    }
  }, [user?.id, workspaceId]);

  // Toggle task completion
  const toggleTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Cannot toggle task: missing user');
      return false;
    }

    try {
      setError(null);
      logger.info('TASKS_HOOK', 'Toggling task', { taskId });

      const updatedTask = await TaskService.toggleTask(user.id, taskId);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === taskId ? updatedTask : task)
      );

      // Refresh stats
      if (workspaceId) {
        const newStats = await TaskService.getTaskStats(user.id, workspaceId);
        setStats(newStats);
      }

      logger.info('TASKS_HOOK', 'Task toggled successfully', { 
        taskId, 
        newStatus: !!updatedTask.completed_at 
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle task';
      setError(errorMessage);
      logger.error('TASKS_HOOK', 'Error toggling task', { error: err });
      return false;
    }
  }, [user?.id, workspaceId]);

  // Refresh tasks manually
  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  // Fetch tasks when dependencies change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    stats,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    refreshTasks,
    setFilters,
    filters
  };
}
