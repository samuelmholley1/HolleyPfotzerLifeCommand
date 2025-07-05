// lib/db/Workspace.ts

import { Model } from '@nozbe/watermelondb';
import { text, field, date } from '@nozbe/watermelondb/decorators';

export class Workspace extends Model {
  static table = 'workspaces';

  @text('name') name: string;
  @text('type') type: string;
  @field('owner_id') ownerId: string;
  @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;
}
