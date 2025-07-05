// types/tasks.ts

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  category?: string;
  due_date?: number;
  estimated_duration?: number;
  actual_duration?: number;
  workspace_id?: string;
  parent_task_id?: string;
  project_id?: string;
  goal_id?: string;
  tags?: string[];
  completed_at?: number;
  is_synced?: boolean;
  task_uuid?: string;
  created_at?: number;
  updated_at?: number;
  recurrence?: string;
  cross_links?: string[];
  slug?: string;
  extra?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  due_date?: number;
  estimated_duration?: number;
  recurrence?: string;
  cross_links?: string[];
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  due_date?: number;
  estimated_duration?: number;
  actual_duration?: number;
  recurrence?: string;
  cross_links?: string[];
  tags?: string[];
  completed?: boolean;
}

export interface TaskFilters {
  completed?: boolean;
  priority?: 'high' | 'medium' | 'low';
  due_date_from?: number;
  due_date_to?: number;
  [key: string]: any;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
}
