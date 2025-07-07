// packages/web/src/types/auth.ts
import { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  active_workspace_id?: string | null;
  name?: string | null;
}
