// lib/db/models/CommunicationMode.ts

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class CommunicationMode extends Model {
  static table = 'communication_modes';

  @field('workspace_id') workspaceId: string;
  @field('current_mode') currentMode: string; // 'normal', 'careful', 'emergency_break', 'mediated'
  @field('state_display') stateDisplay: string; // 'calm', 'tense', 'paused'
  @field('state_color') stateColor: string; // 'green', 'yellow', 'red'
  @field('active_topic') activeTopic?: string;
  @field('timeout_end') timeoutEnd?: number;
  @field('last_break_timestamp') lastBreakTimestamp?: number;
  @field('break_count_today') breakCountToday: number;
  @field('partner_acknowledged') partnerAcknowledged: boolean;
  @field('auto_detection_enabled') autoDetectionEnabled: boolean;
  @field('pattern_confidence') patternConfidence: number;
  @field('is_synced') isSynced: boolean;
  @readonly @date('created_at') createdAt: Date;
  @readonly @date('updated_at') updatedAt: Date;
}
