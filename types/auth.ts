// Authentication types for the application

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url?: string | null;
  provider?: string;
  user_metadata?: any;
  created_at?: string;
  updated_at?: string;
  active_workspace_id?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}
