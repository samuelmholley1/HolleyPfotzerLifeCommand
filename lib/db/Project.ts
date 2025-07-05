// lib/db/Project.ts

import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class Project extends Model {
  static table = 'projects';

  @text('title') title!: string;
  @text('description') description!: string;
  @text('status') status!: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  @text('priority') priority!: 'low' | 'medium' | 'high' | 'urgent';
  @text('category') category!: 'work' | 'personal' | 'health' | 'learning' | 'side_project';
  @field('start_date') startDate!: number | null;
  @field('target_completion_date') targetCompletionDate!: number | null;
  @field('actual_completion_date') actualCompletionDate!: number | null;
  @field('estimated_duration') estimatedDuration!: number | null; // total estimated hours
  @field('actual_duration') actualDuration!: number | null; // total actual hours
  @field('completion_percentage') completionPercentage!: number;
  @field('workspace_id') workspaceId!: string;
  @field('goal_id') goalId!: string | null;
  @text('tags') tags!: string; // JSON array stored as string
  @text('milestones') milestones!: string; // JSON array of milestone objects
  @text('resources') resources!: string; // JSON array of resource links/notes
  @field('is_synced') isSynced!: boolean;
  @field('project_uuid') projectUuid!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper methods
  get tagsArray(): string[] {
    try {
      return this.tags ? JSON.parse(this.tags) : [];
    } catch (error) {
      console.error(`JSON parsing error for Project tags [ID: ${this.id}]:`, {
        projectId: this.id,
        projectTitle: this.title,
        rawTags: this.tags,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  get milestonesArray(): Array<{
    id: string;
    title: string;
    description?: string;
    targetDate?: number;
    completedDate?: number;
    isCompleted: boolean;
  }> {
    try {
      return this.milestones ? JSON.parse(this.milestones) : [];
    } catch (error) {
      console.error(`JSON parsing error for Project milestones [ID: ${this.id}]:`, {
        projectId: this.id,
        projectTitle: this.title,
        rawMilestones: this.milestones,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  get resourcesArray(): Array<{
    id: string;
    title: string;
    url?: string;
    description?: string;
    type: 'link' | 'file' | 'note';
  }> {
    try {
      return this.resources ? JSON.parse(this.resources) : [];
    } catch (error) {
      console.error(`JSON parsing error for Project resources [ID: ${this.id}]:`, {
        projectId: this.id,
        projectTitle: this.title,
        rawResources: this.resources,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isActive(): boolean {
    return this.status === 'active';
  }

  get isOverdue(): boolean {
    if (!this.targetCompletionDate || this.status === 'completed') return false;
    return Date.now() > this.targetCompletionDate;
  }

  get progressStatus(): 'not_started' | 'in_progress' | 'nearly_complete' | 'completed' {
    if (this.completionPercentage === 0) return 'not_started';
    if (this.completionPercentage >= 100) return 'completed';
    if (this.completionPercentage >= 80) return 'nearly_complete';
    return 'in_progress';
  }

  get daysUntilTarget(): number | null {
    if (!this.targetCompletionDate) return null;
    const diffMs = this.targetCompletionDate - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  get formattedDuration(): string {
    const duration = this.actualDuration || this.estimatedDuration;
    if (!duration) return '';
    
    const hours = Math.floor(duration);
    const minutes = Math.round((duration % 1) * 60);
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  get completedMilestones(): number {
    return this.milestonesArray.filter(m => m.isCompleted).length;
  }

  get totalMilestones(): number {
    return this.milestonesArray.length;
  }

  // Mark project as completed
  async markCompleted(): Promise<void> {
    await this.update(project => {
      project.status = 'completed';
      project.completionPercentage = 100;
      project.actualCompletionDate = Date.now();
      project.isSynced = false; // Mark for sync
    });
  }

  // Update progress
  async updateProgress(percentage: number): Promise<void> {
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    await this.update(project => {
      project.completionPercentage = clampedPercentage;
      if (clampedPercentage >= 100 && project.status !== 'completed') {
        project.status = 'completed';
        project.actualCompletionDate = Date.now();
      }
      project.isSynced = false;
    });
  }

  // Update tags
  async updateTags(newTags: string[]): Promise<void> {
    await this.update(project => {
      project.tags = JSON.stringify(newTags);
      project.isSynced = false;
    });
  }

  // Update milestones
  async updateMilestones(newMilestones: Array<any>): Promise<void> {
    await this.update(project => {
      project.milestones = JSON.stringify(newMilestones);
      
      // Auto-update completion percentage based on milestones
      if (newMilestones.length > 0) {
        const completedCount = newMilestones.filter(m => m.isCompleted).length;
        const newPercentage = Math.round((completedCount / newMilestones.length) * 100);
        project.completionPercentage = newPercentage;
      }
      
      project.isSynced = false;
    });
  }

  // Update resources
  async updateResources(newResources: Array<any>): Promise<void> {
    await this.update(project => {
      project.resources = JSON.stringify(newResources);
      project.isSynced = false;
    });
  }

  // Start working on project
  async startProject(): Promise<void> {
    await this.update(project => {
      project.status = 'active';
      if (!project.startDate) {
        project.startDate = Date.now();
      }
      project.isSynced = false;
    });
  }

  // Put project on hold
  async pauseProject(): Promise<void> {
    await this.update(project => {
      project.status = 'on_hold';
      project.isSynced = false;
    });
  }

  // Add time tracking
  async addTimeWorked(hours: number): Promise<void> {
    await this.update(project => {
      project.actualDuration = (project.actualDuration || 0) + hours;
      project.isSynced = false;
    });
  }
}
