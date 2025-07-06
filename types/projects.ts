// types/projects.ts

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';

export interface Project {
  id: string; // UUID
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  title: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string; // ISO 8601 timestamp
  endDate?: string; // ISO 8601 timestamp
  goalId?: string; // Foreign key to a parent Goal
}

// Placeholder for future type definition, not part of MVP
export type CreateProjectData = any;
export type UpdateProjectData = any;
