// types/goals.ts

export type GoalStatus = 'proposed' | 'active' | 'achieved' | 'abandoned';

export interface Goal {
  id: string; // UUID
  workspaceId: string; // Foreign key to Workspace
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  title: string;
  description?: string;
  status: GoalStatus;
  targetDate?: string; // ISO 8601 timestamp
  achievedDate?: string; // ISO 8601 timestamp
}

// These placeholders will be defined when we build the corresponding API endpoints and forms.
export type CreateGoalData = any;
export type UpdateGoalData = any;
