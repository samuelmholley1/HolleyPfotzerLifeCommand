// lib/db/Clarification.ts

import { Model } from '@nozbe/watermelondb';
import { field, text, date, children } from '@nozbe/watermelondb/decorators';

export class Clarification extends Model {
  static table = 'clarifications';

  static associations = {
    clarification_responses: { type: 'has_many' as const, foreignKey: 'clarification_id' },
  };

  @text('workspace_id') workspaceId!: string;
  @text('proposer_id') proposerId!: string;
  @text('topic') topic!: string;
  @text('assumptions') assumptions!: string; // JSON string of assumptions array
  @text('status') status!: string; // 'pending', 'agreed', 'needs_discussion', 'cancelled'
  @field('is_synced') isSynced!: boolean;
  @text('clarification_uuid') clarificationUUID!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @children('clarification_responses') responses: any;

  // Helper methods to work with assumptions as array
  getAssumptionsArray(): string[] {
    try {
      return JSON.parse(this.assumptions);
    } catch {
      return [];
    }
  }

  setAssumptionsArray(assumptionsArray: string[]): void {
    this.assumptions = JSON.stringify(assumptionsArray);
  }
}
