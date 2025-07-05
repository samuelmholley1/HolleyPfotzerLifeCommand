// lib/services/taskService.ts

import { database, Task } from '../db/index';
import { Q } from '@nozbe/watermelondb';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'work' | 'health' | 'personal' | 'strategy';
  dueDate?: Date;
  estimatedDuration?: number; // minutes
  workspaceId: string;
  parentTaskId?: string;
  tags?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'work' | 'health' | 'personal' | 'strategy';
  dueDate?: Date | null;
  estimatedDuration?: number | null;
  actualDuration?: number | null;
  tags?: string[];
}

export class TaskService {
  private static tasksCollection = database.collections.get<Task>('tasks');

  // Create a new task
  static async createTask(data: CreateTaskData): Promise<Task> {
    return await database.write(async () => {
      return await this.tasksCollection.create(task => {
        task.title = data.title;
        task.description = data.description || '';
        task.status = 'pending';
        task.priority = data.priority || 'medium';
        task.category = data.category || 'personal';
        task.dueDate = data.dueDate ? data.dueDate.getTime() : null;
        task.estimatedDuration = data.estimatedDuration || null;
        task.workspaceId = data.workspaceId;
        task.parentTaskId = data.parentTaskId || null;
        task.tags = JSON.stringify(data.tags || []);
        task.isSynced = false;
        task.taskUuid = uuidv4();
      });
    });
  }

  // Get all tasks for a workspace
  static async getTasksForWorkspace(workspaceId: string): Promise<Task[]> {
    return await this.tasksCollection
      .query(Q.where('workspace_id', workspaceId))
      .fetch();
  }

  // Get tasks by status
  static async getTasksByStatus(
    workspaceId: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<Task[]> {
    return await this.tasksCollection
      .query(
        Q.where('workspace_id', workspaceId),
        Q.where('status', status)
      )
      .fetch();
  }

  // Get tasks by category
  static async getTasksByCategory(
    workspaceId: string, 
    category: 'work' | 'health' | 'personal' | 'strategy'
  ): Promise<Task[]> {
    return await this.tasksCollection
      .query(
        Q.where('workspace_id', workspaceId),
        Q.where('category', category)
      )
      .fetch();
  }

  // Get overdue tasks
  static async getOverdueTasks(workspaceId: string): Promise<Task[]> {
    const now = Date.now();
    return await this.tasksCollection
      .query(
        Q.where('workspace_id', workspaceId),
        Q.where('due_date', Q.lt(now)),
        Q.where('status', Q.notEq('completed'))
      )
      .fetch();
  }

  // Get today's tasks
  static async getTodaysTasks(workspaceId: string): Promise<Task[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await this.tasksCollection
      .query(
        Q.where('workspace_id', workspaceId),
        Q.where('due_date', Q.between(startOfDay.getTime(), endOfDay.getTime())),
        Q.where('status', Q.notEq('completed'))
      )
      .fetch();
  }

  // Update a task
  static async updateTask(taskId: string, data: UpdateTaskData): Promise<Task> {
    const task = await this.tasksCollection.find(taskId);
    
    return await database.write(async () => {
      return await task.update(taskRecord => {
        if (data.title !== undefined) taskRecord.title = data.title;
        if (data.description !== undefined) taskRecord.description = data.description;
        if (data.status !== undefined) {
          taskRecord.status = data.status;
          if (data.status === 'completed') {
            taskRecord.completedAt = Date.now();
          }
        }
        if (data.priority !== undefined) taskRecord.priority = data.priority;
        if (data.category !== undefined) taskRecord.category = data.category;
        if (data.dueDate !== undefined) {
          taskRecord.dueDate = data.dueDate ? data.dueDate.getTime() : null;
        }
        if (data.estimatedDuration !== undefined) {
          taskRecord.estimatedDuration = data.estimatedDuration;
        }
        if (data.actualDuration !== undefined) {
          taskRecord.actualDuration = data.actualDuration;
        }
        if (data.tags !== undefined) {
          taskRecord.tags = JSON.stringify(data.tags);
        }
        taskRecord.isSynced = false;
      });
    });
  }

  // Delete a task
  static async deleteTask(taskId: string): Promise<void> {
    const task = await this.tasksCollection.find(taskId);
    
    await database.write(async () => {
      await task.destroyPermanently();
    });
  }

  // Get task statistics for a workspace
  static async getTaskStats(workspaceId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
  }> {
    const allTasks = await this.getTasksForWorkspace(workspaceId);
    const overdueTasks = await this.getOverdueTasks(workspaceId);

    return {
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      overdue: overdueTasks.length,
    };
  }

  // Search tasks
  static async searchTasks(workspaceId: string, searchTerm: string): Promise<Task[]> {
    const allTasks = await this.getTasksForWorkspace(workspaceId);
    const searchLower = searchTerm.toLowerCase();
    
    return allTasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower) ||
      task.tagsArray.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
}
