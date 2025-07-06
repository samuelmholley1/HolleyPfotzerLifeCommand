export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'deferred' | 'cancelled';

export interface Task {
  id: string; // UUID
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number; // e.g., 1-5
  dueDate?: string; // ISO 8601 timestamp
  completedAt?: string; // ISO 8601 timestamp
  projectId?: string; // Foreign key to Project
  goalId?: string; // Foreign key to Goal
  // We will add recurrence and cross-linking later. Focus on the core.
}

// These can remain 'any' for now as they are not core to the MVP data structure.
export type RecurrenceRule = any;
export type CrossLink = any;
