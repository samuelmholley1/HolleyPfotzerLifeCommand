export type CreateTaskInput = Record<string, never>;
export type CreateTaskInput = {
  title: string;
  description?: string;
  priority: number;
};

// ----- Added automatically (July 6 2025) ------------------------------
// Re-export the Task row shape from the canonical Supabase schema
import { Database } from '../supabase';
export type Task = Database['public']['Tables']['tasks']['Row'];
// ----------------------------------------------------------------------
// — auto-added July 6 2025 —
// Re-export Supabase row shape so front-end imports work.
import { Database } from '../supabase';
export type Task = Database['public']['Tables']['tasks']['Row'];
