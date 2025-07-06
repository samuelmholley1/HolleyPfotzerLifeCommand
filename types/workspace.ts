// Types for workspace functionality

import { DailyStatus } from './dailyStatus';

export interface BriefingMember {
  id: string;
  user_id: string;
  name: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  daily_status?: DailyStatus;
  status?: DailyStatus; // Alias for daily_status for backward compatibility
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}
