// Types for daily status functionality

export type EnergyLevel = 'low' | 'medium' | 'high';

export interface DailyStatus {
  id: string;
  user_id: string;
  workspace_id: string;
  date: string;
  energy_level: EnergyLevel;
  main_focus: string;
  heads_up: string;
  created_at: string;
  updated_at: string;
}

export interface BriefingMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  daily_status?: DailyStatus;
}
