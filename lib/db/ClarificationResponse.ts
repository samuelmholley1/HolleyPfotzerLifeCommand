// lib/db/ClarificationResponse.ts

import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';

export class ClarificationResponse extends Model {
  static table = 'clarification_responses';

  static associations = {
    clarifications: { type: 'belongs_to' as const, key: 'clarification_id' },
  };

  @text('clarification_id') clarificationId: string;
  @text('responder_id') responderId: string;
  @field('assumption_index') assumptionIndex: number;
  @text('response_status') responseStatus: string; // 'agree', 'disagree', 'needs_discussion'
  @field('is_synced') isSynced: boolean;
  @text('response_uuid') responseUUID: string;
  @field('created_at') createdAt: number;
  @field('updated_at') updatedAt: number;

  @relation('clarifications', 'clarification_id') clarification: any;
}

export default ClarificationResponse;
