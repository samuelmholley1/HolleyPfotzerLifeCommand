// Task types for the Life Command application
import { Database } from '@/types/supabase';

// Re-export the Task row shape from the canonical Supabase schema
export type Task = Database['public']['Tables']['tasks']['Row'];

// Legacy type for backward compatibility
export type CreateTaskInput = {
  title: string;
  description?: string;
  priority?: number;
};
