// lib/db/Goal.ts

import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class Goal extends Model {
  static table = 'goals';

  @text('title') title: string;
  @text('description') description: string;
  @text('status') status: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  @text('priority') priority: 'low' | 'medium' | 'high' | 'critical';
  @text('category') category: 'health' | 'career' | 'financial' | 'personal' | 'relationships' | 'learning';
  @field('target_date') targetDate: number | null;
  @field('start_date') startDate: number | null;
  @field('completion_percentage') completionPercentage: number;
  @field('workspace_id') workspaceId: string;
  @field('parent_goal_id') parentGoalId: string | null;
  @text('tags') tags: string; // JSON array stored as string
  @text('metrics') metrics: string; // JSON object for tracking progress
  @field('completed_at') completedAt: number | null;
  @field('is_synced') isSynced: boolean;
  @field('goal_uuid') goalUuid: string;
  @readonly @date('created_at') createdAt: Date;
  @readonly @date('updated_at') updatedAt: Date;

  // Helper methods
  get tagsArray(): string[] {
    try {
      return this.tags ? JSON.parse(this.tags) : [];
    } catch (error) {
      console.error(`JSON parsing error for Goal tags [ID: ${this.id}]:`, {
        goalId: this.id,
        goalTitle: this.title,
        rawTags: this.tags,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  get metricsObject(): Record<string, any> {
    try {
      return this.metrics ? JSON.parse(this.metrics) : {};
    } catch (error) {
      console.error(`JSON parsing error for Goal metrics [ID: ${this.id}]:`, {
        goalId: this.id,
        goalTitle: this.title,
        rawMetrics: this.metrics,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {};
    }
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isActive(): boolean {
    return this.status === 'active';
  }

  get isOverdue(): boolean {
    if (!this.targetDate || this.status === 'completed') return false;
    return Date.now() > this.targetDate;
  }

  get progressStatus(): 'not_started' | 'in_progress' | 'nearly_complete' | 'completed' {
    if (this.completionPercentage === 0) return 'not_started';
    if (this.completionPercentage >= 100) return 'completed';
    if (this.completionPercentage >= 80) return 'nearly_complete';
    return 'in_progress';
  }

  get daysUntilTarget(): number | null {
    if (!this.targetDate) return null;
    const diffMs = this.targetDate - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // Mark goal as completed
  async markCompleted(): Promise<void> {
    await this.update(goal => {
      goal.status = 'completed';
      goal.completionPercentage = 100;
      goal.completedAt = Date.now();
      goal.isSynced = false; // Mark for sync
    });
  }

  // Update progress
  async updateProgress(percentage: number): Promise<void> {
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    await this.update(goal => {
      goal.completionPercentage = clampedPercentage;
      if (clampedPercentage >= 100 && goal.status !== 'completed') {
        goal.status = 'completed';
        goal.completedAt = Date.now();
      }
      goal.isSynced = false;
    });
  }

  // Update tags
  async updateTags(newTags: string[]): Promise<void> {
    await this.update(goal => {
      goal.tags = JSON.stringify(newTags);
      goal.isSynced = false;
    });
  }

  // Update metrics
  async updateMetrics(newMetrics: Record<string, any>): Promise<void> {
    await this.update(goal => {
      goal.metrics = JSON.stringify(newMetrics);
      goal.isSynced = false;
    });
  }

  // Start working on goal
  async startGoal(): Promise<void> {
    await this.update(goal => {
      goal.status = 'active';
      if (!goal.startDate) {
        goal.startDate = Date.now();
      }
      goal.isSynced = false;
    });
  }

  // Put goal on hold
  async pauseGoal(): Promise<void> {
    await this.update(goal => {
      goal.status = 'on_hold';
      goal.isSynced = false;
    });
  }
}
