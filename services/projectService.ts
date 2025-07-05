// services/projectService.ts

import { Q } from '@nozbe/watermelondb';
import { database, Project, Goal } from '../lib/db';
import { CreateProjectData, UpdateProjectData } from '../types/projects';
import { log } from '../lib/logging';
import { v4 as uuidv4 } from 'uuid';

// Validation constants
const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const VALID_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_CATEGORIES = ['work', 'personal', 'health', 'learning', 'side_project'];

export class ProjectService {
  private static instance: ProjectService;

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  private constructor() {}

  // Validation methods
  private validateProjectInput(data: CreateProjectData | UpdateProjectData): void {
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

    // Validate completion percentage
    if ('completionPercentage' in data && data.completionPercentage !== undefined) {
      if (typeof data.completionPercentage !== 'number' || 
          data.completionPercentage < 0 || 
          data.completionPercentage > 100 ||
          !Number.isInteger(data.completionPercentage)) {
        throw new Error('Completion percentage must be an integer between 0 and 100');
      }
    }

    // Validate dates
    if (data.startDate !== undefined && data.startDate !== null) {
      if (typeof data.startDate !== 'number' || data.startDate <= 0) {
        throw new Error('Start date must be a valid timestamp');
      }
    }

    if (data.targetCompletionDate !== undefined && data.targetCompletionDate !== null) {
      if (typeof data.targetCompletionDate !== 'number' || data.targetCompletionDate <= 0) {
        throw new Error('Target completion date must be a valid timestamp');
      }
      
      // Validate that target date is after start date
      if (data.startDate && data.targetCompletionDate <= data.startDate) {
        throw new Error('Target completion date must be after start date');
      }
    }

    if ('actualCompletionDate' in data && data.actualCompletionDate !== undefined && data.actualCompletionDate !== null) {
      if (typeof data.actualCompletionDate !== 'number' || data.actualCompletionDate <= 0) {
        throw new Error('Actual completion date must be a valid timestamp');
      }
    }

    // Validate duration fields
    if (data.estimatedDuration !== undefined && data.estimatedDuration !== null) {
      if (typeof data.estimatedDuration !== 'number' || data.estimatedDuration < 0) {
        throw new Error('Estimated duration must be a positive number');
      }
    }

    if ('actualDuration' in data && data.actualDuration !== undefined && data.actualDuration !== null) {
      if (typeof data.actualDuration !== 'number' || data.actualDuration < 0) {
        throw new Error('Actual duration must be a positive number');
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

    // Validate milestones array
    if (data.milestones !== undefined) {
      if (!Array.isArray(data.milestones)) {
        throw new Error('Milestones must be an array');
      }
      for (const milestone of data.milestones) {
        if (typeof milestone !== 'object' || milestone === null) {
          throw new Error('Each milestone must be an object');
        }
        if (!milestone.id || !milestone.title) {
          throw new Error('Each milestone must have an id and title');
        }
      }
    }

    // Validate resources array
    if (data.resources !== undefined) {
      if (!Array.isArray(data.resources)) {
        throw new Error('Resources must be an array');
      }
      for (const resource of data.resources) {
        if (typeof resource !== 'object' || resource === null) {
          throw new Error('Each resource must be an object');
        }
        if (!resource.id || !resource.title || !resource.type) {
          throw new Error('Each resource must have an id, title, and type');
        }
        if (!['link', 'file', 'note'].includes(resource.type)) {
          throw new Error('Resource type must be one of: link, file, note');
        }
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

  private async validateGoalReference(goalId: string, workspaceId: string): Promise<void> {
    try {
      const goal = await database.collections
        .get<Goal>('goals')
        .find(goalId);
      
      if (!goal) {
        throw new Error('Goal not found');
      }

      if (goal.workspaceId !== workspaceId) {
        throw new Error('Goal must be in the same workspace as the project');
      }
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new Error('Goal not found or access denied');
      }
      throw error;
    }
  }

  // Get all projects for a workspace
  async getProjectsForWorkspace(workspaceId: string): Promise<Project[]> {
    try {
      const projects = await database.collections
        .get<Project>('projects')
        .query(Q.where('workspace_id', workspaceId))
        .fetch();
      
      log.info('projectService', `Fetched ${projects.length} projects for workspace ${workspaceId}`);
      return projects;
    } catch (error: any) {
      log.error('projectService', 'Failed to fetch projects', { workspaceId, error });
      throw error;
    }
  }

  // Get active projects for a workspace
  async getActiveProjects(workspaceId: string): Promise<Project[]> {
    try {
      const projects = await database.collections
        .get<Project>('projects')
        .query(
          Q.where('workspace_id', workspaceId),
          Q.where('status', 'active')
        )
        .fetch();
      
      return projects;
    } catch (error: any) {
      log.error('projectService', 'Failed to fetch active projects', { workspaceId, error });
      throw error;
    }
  }

  // Get projects by status
  async getProjectsByStatus(workspaceId: string, status: string): Promise<Project[]> {
    try {
      const projects = await database.collections
        .get<Project>('projects')
        .query(
          Q.where('workspace_id', workspaceId),
          Q.where('status', status)
        )
        .fetch();
      
      return projects;
    } catch (error: any) {
      log.error('projectService', 'Failed to fetch projects by status', { workspaceId, status, error });
      throw error;
    }
  }

  // Get projects for a specific goal
  async getProjectsForGoal(goalId: string): Promise<Project[]> {
    try {
      const projects = await database.collections
        .get<Project>('projects')
        .query(Q.where('goal_id', goalId))
        .fetch();
      
      return projects;
    } catch (error: any) {
      log.error('projectService', 'Failed to fetch projects for goal', { goalId, error });
      throw error;
    }
  }

  // Create a new project
  async createProject(projectData: CreateProjectData): Promise<Project> {
    try {
      // Input validation
      this.validateProjectInput(projectData);
      
      // Referential integrity checks
      await this.validateWorkspaceAccess(projectData.workspaceId);
      
      if (projectData.goalId) {
        await this.validateGoalReference(projectData.goalId, projectData.workspaceId);
      }
      
      const projectCollection = database.collections.get<Project>('projects');
      
      const newProject = await database.write(async () => {
        return await projectCollection.create(project => {
          project.title = projectData.title.trim();
          project.description = projectData.description?.trim() || '';
          project.status = projectData.status || 'planning';
          project.priority = projectData.priority || 'medium';
          project.category = projectData.category;
          project.startDate = projectData.startDate || null;
          project.targetCompletionDate = projectData.targetCompletionDate || null;
          project.actualCompletionDate = null;
          project.estimatedDuration = projectData.estimatedDuration || null;
          project.actualDuration = null;
          project.completionPercentage = 0;
          project.workspaceId = projectData.workspaceId;
          project.goalId = projectData.goalId || null;
          project.tags = JSON.stringify(projectData.tags || []);
          project.milestones = JSON.stringify(projectData.milestones || []);
          project.resources = JSON.stringify(projectData.resources || []);
          project.isSynced = false;
          project.projectUuid = uuidv4();
        });
      });

      log.info('projectService', 'Project created successfully', { 
        projectId: newProject.id,
        title: projectData.title,
        workspaceId: projectData.workspaceId
      });

      return newProject;
    } catch (error: any) {
      log.error('projectService', 'Failed to create project', { projectData, error });
      throw error;
    }
  }

  // Update an existing project
  async updateProject(projectId: string, updateData: UpdateProjectData): Promise<Project> {
    try {
      // Input validation
      this.validateProjectInput(updateData);
      
      const project = await database.collections.get<Project>('projects').find(projectId);
      
      // Validate workspace access for the existing project
      await this.validateWorkspaceAccess(project.workspaceId);
      
      // If updating goalId, validate it
      if (updateData.goalId !== undefined && updateData.goalId !== null) {
        await this.validateGoalReference(updateData.goalId, project.workspaceId);
      }
      
      const updatedProject = await database.write(async () => {
        return await project.update(p => {
          if (updateData.title !== undefined) p.title = updateData.title.trim();
          if (updateData.description !== undefined) p.description = updateData.description?.trim() || '';
          if (updateData.status !== undefined) p.status = updateData.status;
          if (updateData.priority !== undefined) p.priority = updateData.priority;
          if (updateData.category !== undefined) p.category = updateData.category;
          if (updateData.startDate !== undefined) p.startDate = updateData.startDate;
          if (updateData.targetCompletionDate !== undefined) p.targetCompletionDate = updateData.targetCompletionDate;
          if (updateData.actualCompletionDate !== undefined) p.actualCompletionDate = updateData.actualCompletionDate;
          if (updateData.estimatedDuration !== undefined) p.estimatedDuration = updateData.estimatedDuration;
          if (updateData.actualDuration !== undefined) p.actualDuration = updateData.actualDuration;
          if (updateData.completionPercentage !== undefined) {
            // Clamp percentage between 0 and 100
            p.completionPercentage = Math.max(0, Math.min(100, updateData.completionPercentage));
          }
          if (updateData.goalId !== undefined) p.goalId = updateData.goalId;
          if (updateData.tags !== undefined) p.tags = JSON.stringify(updateData.tags);
          if (updateData.milestones !== undefined) p.milestones = JSON.stringify(updateData.milestones);
          if (updateData.resources !== undefined) p.resources = JSON.stringify(updateData.resources);
          
          p.isSynced = false;
        });
      });

      log.info('projectService', 'Project updated successfully', { projectId });
      return updatedProject;
    } catch (error: any) {
      log.error('projectService', 'Failed to update project', { projectId, updateData, error });
      throw error;
    }
  }

  // Delete a project
  async deleteProject(projectId: string): Promise<void> {
    try {
      const project = await database.collections.get<Project>('projects').find(projectId);
      
      await database.write(async () => {
        await project.destroyPermanently();
      });

      log.info('projectService', 'Project deleted successfully', { projectId });
    } catch (error: any) {
      log.error('projectService', 'Failed to delete project', { projectId, error });
      throw error;
    }
  }

  // Get project by ID
  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const project = await database.collections.get<Project>('projects').find(projectId);
      return project;
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return null;
      }
      log.error('projectService', 'Failed to get project by ID', { projectId, error });
      throw error;
    }
  }

  // Mark project as completed
  async completeProject(projectId: string): Promise<Project> {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    await project.markCompleted();
    return project;
  }

  // Update project progress
  async updateProgress(projectId: string, percentage: number): Promise<Project> {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    await project.updateProgress(percentage);
    return project;
  }

  // Add time worked on project
  async addTimeWorked(projectId: string, hours: number): Promise<Project> {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    await project.addTimeWorked(hours);
    return project;
  }
}

export const projectService = ProjectService.getInstance();
