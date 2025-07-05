// lib/db/WorkspaceMember.ts

import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export class WorkspaceMember extends Model {
  static table = 'workspace_members';

  @field('workspace_id') workspaceId: string;
  @field('user_id') userId: string;
  @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;
}
