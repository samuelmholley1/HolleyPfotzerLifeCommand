// lib/db/Event.ts

import { Model } from '@nozbe/watermelondb';
import { field, text, date } from '@nozbe/watermelondb/decorators';

export class Event extends Model {
  static table = 'events';

  @text('event_type') eventType!: string;
  @field('timestamp') timestamp!: number;
  @field('is_synced') isSynced!: boolean;
  @text('encrypted_payload') encryptedPayload!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('event_uuid') eventUUID!: string;
  @field('workspace_id') workspaceId!: string;
  @field('project_id') projectId!: string | null;
}
