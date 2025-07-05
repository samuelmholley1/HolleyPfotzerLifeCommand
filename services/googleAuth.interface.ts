// Shared types and interface for Google Auth across platforms
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
}

export interface GoogleAuthResult {
  user: GoogleUser;
  idToken: string;
  accessToken?: string;
}

export interface GoogleAuthService {
  initialize(): Promise<void>;
  signIn(): Promise<GoogleAuthResult>;
  signOut(): Promise<void>;
  isSignedIn(): Promise<boolean>;
  getCurrentUser(): Promise<GoogleUser | null>;
}
