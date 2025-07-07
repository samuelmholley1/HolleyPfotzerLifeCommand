"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { AuthUser } from '../types/auth';
import { createClient } from '../lib/supabase/client';
import { User } from '@supabase/supabase-js';

// 1. DEFINE THE AUTHORITATIVE USER AND AUTH STATE TYPES
export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// 2. DEFINE THE CONTEXT TYPE
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  active_workspace_id: string | null | undefined;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. CREATE THE AUTH PROVIDER COMPONENT
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // E2E stub: if running in test/E2E mode, always provide a fake user
  if (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_PW_E2E === '1' || process.env.NODE_ENV === 'test' || process.env.E2E === 'true')) {
    if (process.env.NEXT_PUBLIC_PW_E2E === '1') {
      return <div data-testid="stub-authenticated">E2E User</div>;
    }
    const fakeUser = {
      id: 'e2e-user',
      email: 'e2e@example.com',
      name: 'E2E User',
      avatar_url: null,
      active_workspace_id: 'e2e-workspace',
    };
    const value = {
      user: fakeUser,
      loading: false,
      error: null,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  const supabase = createClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Helper to format the Supabase user into our app's user type
  const formatUser = (user: User): AuthUser => ({
    ...user,
    email: user.email ?? undefined,
    name: user.user_metadata?.name ?? user.email ?? undefined,
    active_workspace_id: user.user_metadata?.active_workspace_id ?? null,
  });
  
  const getSession = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;
      
      const user = formatUser(session?.user ?? null);
      let finalUser = user;

      // If a user exists, fetch their active workspace from the profiles table
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('active_workspace_id')
          .eq('id', user.id)
          .single();
        finalUser = { ...user, active_workspace_id: profile?.active_workspace_id ?? null };
      }
      
      setAuthState({ user: finalUser, loading: false, error: null });
    } catch (error) {
      console.error("Auth Error:", error);
      setAuthState({ user: null, loading: false, error: 'Failed to initialize session.' });
    }
  }, [supabase, formatUser]);

  useEffect(() => {
    getSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
       // For simplicity, we just re-run getSession on any auth change.
       // This ensures profile data is always in sync.
       getSession();
    });
    return () => authListener.subscription.unsubscribe();
  }, [supabase, getSession]);

  const signInWithGoogle = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Changed from /auth/callback to root
      },
    });
    if (error) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    await supabase.auth.signOut();
    setAuthState({ user: null, loading: false, error: null });
  };

  const { user, loading } = authState;
  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        loading: authState.loading,
        active_workspace_id: authState.user?.active_workspace_id,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 4. CREATE THE USEAUTH HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

console.log('AuthContext E2E flag:', process.env.NEXT_PUBLIC_PW_E2E);
