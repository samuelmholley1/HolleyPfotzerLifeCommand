// services/goalService.ts

import { Q } from '@nozbe/watermelondb';
import { database, Goal } from '../lib/db';
import { CreateGoalData, UpdateGoalData } from '../types/goals';
import { log } from '../lib/logging';
import { v4 as uuidv4 } from 'uuid';

// Validation constants
const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const VALID_STATUSES = ['draft', 'active', 'on_hold', 'completed', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_CATEGORIES = ['health', 'career', 'financial', 'personal', 'relationships', 'learning'];

export class GoalService {
  private static instance: GoalService;

  public static getInstance(): GoalService {
    if (!GoalService.instance) {
      GoalService.instance = new GoalService();
    }
    return GoalService.instance;
  }

  private constructor() {}

  // Validation methods
  private validateGoalInput(data: CreateGoalData | UpdateGoalData): void {
    // Validate title
    if (data.title !== undefined) {
      if (!data.title || typeof data.title !== 'string') {
        throw new Error('Title is required and must be a non-empty string');
      }
      if (data.title.trim().length === 0) {
        throw new Error('Title cannot be empty or only whitespace');
      }
      if (data.title.length > MAX_TITLE_LENGTH) {
        throw new Error(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
      }
    }

    // Validate description
    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string') {
        throw new Error('Description must be a string');
      }
      if (data.description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
      }
    }

    // Validate status
    if (data.status !== undefined) {
      if (!VALID_STATUSES.includes(data.status)) {
        throw new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
      }
    }

    // Validate priority
    if (data.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(data.priority)) {
        throw new Error(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
      }
    }

    // Validate category (required for create)
    if ('category' in data) {
      if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
        throw new Error(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
      }
    }

    // Validate completion percentage (only for updates)
    if ('completionPercentage' in data && data.completionPercentage !== undefined) {
      if (typeof data.completionPercentage !== 'number' || 
          data.completionPercentage < 0 || 
          data.completionPercentage > 100 ||
          !Number.isInteger(data.completionPercentage)) {
        throw new Error('Completion percentage must be an integer between 0 and 100');
      }
    }

    // Validate dates
    if (data.targetDate !== undefined && data.targetDate !== null) {
      if (typeof data.targetDate !== 'number' || data.targetDate <= 0) {
        throw new Error('Target date must be a valid timestamp');
      }
    }

    if (data.startDate !== undefined && data.startDate !== null) {
      if (typeof data.startDate !== 'number' || data.startDate <= 0) {
        throw new Error('Start date must be a valid timestamp');
      }
    }

    // Validate tags array
    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        throw new Error('Tags must be an array');
      }
      for (const tag of data.tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error('All tags must be non-empty strings');
        }
        if (tag.length > 50) {
          throw new Error('Each tag cannot exceed 50 characters');
        }
      }
    }

    // Validate metrics object
    if (data.metrics !== undefined) {
      if (typeof data.metrics !== 'object' || data.metrics === null || Array.isArray(data.metrics)) {
        throw new Error('Metrics must be a valid object');
      }
    }
  }

  // Referential integrity checks
  private async validateWorkspaceAccess(workspaceId: string): Promise<void> {
    try {
      // Check if workspace exists and user has access
      const workspace = await database.collections
        .get('workspaces')
        .find(workspaceId);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Check if user is a member of this workspace
      const membership = await database.collections
        .get('workspace_members')
        .query(Q.where('workspace_id', workspaceId))
        .fetch();

      if (membership.length === 0) {
        throw new Error('Access denied: Not a member of this workspace');
      }
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new Error('Workspace not found or access denied');
      }
      throw error;
    }
  }

  private async validateParentGoal(parentGoalId: string, workspaceId: string): Promise<void> {
    try {
      const parentGoal = await database.collections
        .get<Goal>('goals')
        .find(parentGoalId);
      
      if (!parentGoal) {
        throw new Error('Parent goal not found');
      }

      if (parentGoal.workspaceId !== workspaceId) {
        throw new Error('Parent goal must be in the same workspace');
      }
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new Error('Parent goal not found or access denied');
      }
      throw error;
    }
  }

  // Get all goals for a workspace
  async getGoalsForWorkspace(workspaceId: string): Promise<Goal[]> {
    try {
      const goals = await database.collections
        .get<Goal>('goals')
        .query(Q.where('workspace_id', workspaceId))
        .fetch();
      
      log.info('goalService', `Fetched ${goals.length} goals for workspace ${workspaceId}`);
      return goals;
    } catch (error) {
      log.error('goalService', 'Failed to fetch goals', { workspaceId, error });
      throw error;
    }
  }

  // Get active goals for a workspace
  async getActiveGoals(workspaceId: string): Promise<Goal[]> {
    try {
      const goals = await database.collections
        .get<Goal>('goals')
        .query(
          Q.where('workspace_id', workspaceId),
          Q.where('status', 'active')
        )
        .fetch();
      
      return goals;
    } catch (error) {
      log.error('goalService', 'Failed to fetch active goals', { workspaceId, error });
      throw error;
    }
  }

  // Get goals by status
  async getGoalsByStatus(workspaceId: string, status: string): Promise<Goal[]> {
    try {
      const goals = await database.collections
        .get<Goal>('goals')
        .query(
          Q.where('workspace_id', workspaceId),
          Q.where('status', status)
        )
        .fetch();
      
      return goals;
    } catch (error) {
      log.error('goalService', 'Failed to fetch goals by status', { workspaceId, status, error });
      throw error;
    }
  }

  // Create a new goal
  async createGoal(goalData: CreateGoalData): Promise<Goal> {
    try {
      // Input validation
      this.validateGoalInput(goalData);
      
      // Referential integrity checks
      await this.validateWorkspaceAccess(goalData.workspaceId);
      
      if (goalData.parentGoalId) {
        await this.validateParentGoal(goalData.parentGoalId, goalData.workspaceId);
      }
      
      const goalCollection = database.collections.get<Goal>('goals');
      
      const newGoal = await database.write(async () => {
        return await goalCollection.create(goal => {
          goal.title = goalData.title.trim();
          goal.description = goalData.description?.trim() || '';
          goal.status = goalData.status || 'draft';
          goal.priority = goalData.priority || 'medium';
          goal.category = goalData.category;
          goal.targetDate = goalData.targetDate || null;
          goal.startDate = goalData.startDate || null;
          goal.completionPercentage = 0;
          goal.workspaceId = goalData.workspaceId;
          goal.parentGoalId = goalData.parentGoalId || null;
          goal.tags = JSON.stringify(goalData.tags || []);
          goal.metrics = JSON.stringify(goalData.metrics || {});
          goal.completedAt = null;
          goal.isSynced = false;
          goal.goalUuid = uuidv4();
        });
      });

      log.info('goalService', 'Goal created successfully', { 
        goalId: newGoal.id,
        title: goalData.title,
        workspaceId: goalData.workspaceId
      });

      return newGoal;
    } catch (error) {
      log.error('goalService', 'Failed to create goal', { goalData, error });
      throw error;
    }
  }

  // Update an existing goal
  async updateGoal(goalId: string, updateData: UpdateGoalData): Promise<Goal> {
    try {
      // Input validation
      this.validateGoalInput(updateData);
      
      const goal = await database.collections.get<Goal>('goals').find(goalId);
      
      // Validate workspace access for the existing goal
      await this.validateWorkspaceAccess(goal.workspaceId);
      
      // If updating parentGoalId, validate it
      if (updateData.parentGoalId !== undefined && updateData.parentGoalId !== null) {
        await this.validateParentGoal(updateData.parentGoalId, goal.workspaceId);
      }
      
      const updatedGoal = await database.write(async () => {
        return await goal.update(g => {
          if (updateData.title !== undefined) g.title = updateData.title.trim();
          if (updateData.description !== undefined) g.description = updateData.description?.trim() || '';
          if (updateData.status !== undefined) g.status = updateData.status;
          if (updateData.priority !== undefined) g.priority = updateData.priority;
          if (updateData.category !== undefined) g.category = updateData.category;
          if (updateData.targetDate !== undefined) g.targetDate = updateData.targetDate;
          if (updateData.startDate !== undefined) g.startDate = updateData.startDate;
          if (updateData.completionPercentage !== undefined) {
            // Clamp percentage between 0 and 100
            g.completionPercentage = Math.max(0, Math.min(100, updateData.completionPercentage));
          }
          if (updateData.parentGoalId !== undefined) g.parentGoalId = updateData.parentGoalId;
          if (updateData.tags !== undefined) g.tags = JSON.stringify(updateData.tags);
          if (updateData.metrics !== undefined) g.metrics = JSON.stringify(updateData.metrics);
          if (updateData.completedAt !== undefined) g.completedAt = updateData.completedAt;
          
          g.isSynced = false;
        });
      });

      log.info('goalService', 'Goal updated successfully', { goalId });
      return updatedGoal;
    } catch (error) {
      log.error('goalService', 'Failed to update goal', { goalId, updateData, error });
      throw error;
    }
  }

  // Delete a goal
  async deleteGoal(goalId: string): Promise<void> {
    try {
      const goal = await database.collections.get<Goal>('goals').find(goalId);
      
      await database.write(async () => {
        await goal.destroyPermanently();
      });

      log.info('goalService', 'Goal deleted successfully', { goalId });
    } catch (error) {
      log.error('goalService', 'Failed to delete goal', { goalId, error });
      throw error;
    }
  }

  // Get goal by ID
  async getGoalById(goalId: string): Promise<Goal | null> {
    try {
      const goal = await database.collections.get<Goal>('goals').find(goalId);
      return goal;
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return null;
      }
      log.error('goalService', 'Failed to get goal by ID', { goalId, error });
      throw error;
    }
  }

  // Get sub-goals for a parent goal
  async getSubGoals(parentGoalId: string): Promise<Goal[]> {
    try {
      const subGoals = await database.collections
        .get<Goal>('goals')
        .query(Q.where('parent_goal_id', parentGoalId))
        .fetch();
      
      return subGoals;
    } catch (error) {
      log.error('goalService', 'Failed to fetch sub-goals', { parentGoalId, error });
      throw error;
    }
  }

  // Mark goal as completed
  async completeGoal(goalId: string): Promise<Goal> {
    const goal = await this.getGoalById(goalId);
    if (!goal) {
      throw new Error(`Goal with ID ${goalId} not found`);
    }

    await goal.markCompleted();
    return goal;
  }

  // Update goal progress
  async updateProgress(goalId: string, percentage: number): Promise<Goal> {
    const goal = await this.getGoalById(goalId);
    if (!goal) {
      throw new Error(`Goal with ID ${goalId} not found`);
    }

    await goal.updateProgress(percentage);
    return goal;
  }
}

export const goalService = GoalService.getInstance();
