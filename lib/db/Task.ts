// lib/db/Task.ts

import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class Task extends Model {
  static table = 'tasks';

  @text('title') title!: string;
  @text('description') description!: string;
  @text('status') status!: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  @text('priority') priority!: 'low' | 'medium' | 'high' | 'urgent';
  @text('category') category!: 'work' | 'health' | 'personal' | 'strategy';
  @field('due_date') dueDate!: number | null;
  @field('estimated_duration') estimatedDuration!: number | null; // minutes
  @field('actual_duration') actualDuration!: number | null; // minutes
  @field('workspace_id') workspaceId!: string;
  @field('parent_task_id') parentTaskId!: string | null;
  @field('project_id') projectId!: string | null;
  @field('goal_id') goalId!: string | null;
  @text('tags') tags!: string; // JSON array stored as string
  @field('completed_at') completedAt!: number | null;
  @field('is_synced') isSynced!: boolean;
  @field('task_uuid') taskUuid!: string;
  @field('slug') slug!: string; // Human-friendly identifier for admin/debugging
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper methods
  get tagsArray(): string[] {
    try {
      return this.tags ? JSON.parse(this.tags) : [];
    } catch (error) {
      console.error(`JSON parsing error for Task tags [ID: ${this.id}]:`, {
        taskId: this.id,
        taskTitle: this.title,
        rawTags: this.tags,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  get isOverdue(): boolean {
    if (!this.dueDate || this.status === 'completed') return false;
    return Date.now() > this.dueDate;
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get formattedDuration(): string {
    const duration = this.actualDuration || this.estimatedDuration;
    if (!duration) return '';
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // Mark task as completed
  async markCompleted(): Promise<void> {
    await this.update(task => {
      task.status = 'completed';
      task.completedAt = Date.now();
      task.isSynced = false; // Mark for sync
    });
  }

  // Update tags
  async updateTags(newTags: string[]): Promise<void> {
    await this.update(task => {
      task.tags = JSON.stringify(newTags);
      task.isSynced = false;
    });
  }

  // Start working on task
  async startTask(): Promise<void> {
    await this.update(task => {
      task.status = 'in_progress';
      task.isSynced = false;
    });
  }
}
