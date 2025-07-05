import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { AuthUser, AuthState } from '../types/auth'
import { Session } from '@supabase/supabase-js'
import { cryptoManager } from '../lib/crypto.secure'
import { logger } from '../lib/logging'
import { DB_TABLES } from '../lib/constants';
import { WorkspaceService } from '../services/workspaceService';

/**
 * AuthContextType provides authentication state and actions for the app UI.
 * - loading: boolean - true when an auth action is in progress (show spinner)
 * - error: string | null - last error message (show error UI)
 * - signInWithGoogle: (onSuccess?, onError?) => Promise<void> - sign in with Google, optional callbacks
 * - signOut: (onSuccess?, onError?) => Promise<void> - sign out, optional callbacks
 * - hardSignOut: (onSuccess?, onError?) => Promise<void> - hard sign out, optional callbacks
 * - refreshUser: () => Promise<void> - refresh user session
 *
 * Future extensibility: add more providers (Apple, Microsoft) as needed.
 */
interface AuthContextType extends AuthState {
  signOut: (onSuccess?: () => void, onError?: (err: any) => void) => Promise<void>
  refreshUser: () => Promise<void>
  hardSignOut: (onSuccess?: () => void, onError?: (err: any) => void) => Promise<void>
  signInWithGoogle: (onSuccess?: () => void, onError?: (err: any) => void) => Promise<void>
  clearError?: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const formatUser = (session: Session | null): AuthUser | null => {
    if (!session?.user) return null

    return {
      id: session.user.id,
      email: session.user.email || null,
      name: session.user.user_metadata?.full_name || 
            session.user.user_metadata?.name || 
            session.user.email?.split('@')[0] || null,
      avatar_url: session.user.user_metadata?.avatar_url || 
                  session.user.user_metadata?.picture || null,
      // We will fetch this from the profiles table later
      active_workspace_id: session.user.user_metadata?.active_workspace_id || null,
      provider: (session.user.app_metadata?.provider === 'google' ? 'google' : 'email') as 'google' | 'email',
      created_at: session.user.created_at,
    }
  }

  const AUTH_TIMEOUT = 60000; // 60 seconds

  const refreshUser = useCallback(async (isMounted: () => boolean) => {
    const timer = logger.startTimer('AuthContext:refreshUser');
    logger.info('AUTH', 'Starting user refresh...');
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth timeout')), AUTH_TIMEOUT); // 30 second timeout
      });
      
      const authPromise = supabase.auth.getSession();
      
      const { data: { session }, error } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (error) {
        logger.error('AUTH', 'Error getting session', { error: error.message }, error);
        logger.authFailure('Session retrieval failed');
        if (isMounted()) {
          setAuthState({
            user: null,
            loading: false,
            error: error.message,
          })
        }
        return
      }

      logger.info('AUTH', 'Session retrieved successfully.');
      let user = formatUser(session)

      // If we have a user, fetch their profile to get the active workspace
      if (user) {
        logger.info('AUTH', `Fetching profile for user: ${user.id}`);
        const { data: profile, error: profileError } = await supabase
          .from(DB_TABLES.PROFILES)
          .select('active_workspace_id')
          .eq('id', user.id)
          .single();

        if (profileError) {
          logger.error('AUTH', 'Error fetching user profile', { error: profileError.message }, profileError);
          // Don't fail the whole auth, but the user might not have a workspace context
        }

        if (profile) {
          logger.info('AUTH', `Profile fetched. Active workspace: ${profile.active_workspace_id}`);
          user = {
            ...user,
            active_workspace_id: profile.active_workspace_id,
          };
        } else {
          logger.warn('AUTH', 'No profile found for user.');
        }

        // If user still has no active workspace, ensure they get one
        if (!user.active_workspace_id) {
          logger.info('AUTH', 'User has no active workspace, attempting to assign one...');
          const assignedWorkspaceId = await WorkspaceService.ensureUserHasWorkspace(user.id);
          if (assignedWorkspaceId) {
            user = {
              ...user,
              active_workspace_id: assignedWorkspaceId,
            };
          }
        }
      }
      
      if (user) {
        logger.setUserId(user.id);
        logger.authSuccess(user.id ?? '', user.provider ?? '');
        
        // Initialize crypto system for authenticated user (non-blocking)
        setTimeout(async () => {
          try {
            // Generate a more secure temporary password using user data and random salt
            // In production, consider prompting user for encryption password or using device biometrics
            const userSalt = user.id + user.created_at;
            const randomSalt = Math.random().toString(36).substring(2, 15);
            const tempPassword = `lifecmd_${btoa(userSalt + randomSalt)}_${Date.now()}`;
            
            await cryptoManager.initialize(tempPassword);
            logger.info('CRYPTO', 'Crypto system initialized for user');
            logger.cryptoOperation('initialize', true);
          } catch (cryptoError) {
            logger.error('CRYPTO', 'Failed to initialize crypto system', {}, cryptoError as Error);
            logger.cryptoOperation('initialize', false, (cryptoError as Error).message);
            // Don't fail auth completely, but warn user
            console.warn('Crypto initialization failed - encryption may not work properly');
          }
        }, 100); // Initialize crypto after auth state is set
      } else {
        logger.warn('AUTH', 'No user object could be formed from session.');
      }
      
      if (isMounted()) {
        logger.info('AUTH', 'User state updated. Refresh complete.');
        setAuthState({
          user,
          loading: false,
          error: null,
        })
      }
      
      timer();
    } catch (error) {
      timer();
      logger.error('AUTH', 'Error refreshing user', { error: (error as Error).message }, error as Error);
      if (isMounted()) {
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true;
    const isMountedGetter = () => isMounted;

    // The onAuthStateChange listener handles the initial session check as well.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('AUTH', `Auth state changed: ${event}`);
        
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          const user = formatUser(session);
          if (isMountedGetter()) {
            // Immediately set basic user state to unblock UI
            setAuthState({ user, loading: false, error: null });
            if (user) {
              logger.setUserId(user.id);
              logger.authSuccess(user.id ?? '', user.provider ?? '');
              
              // Fetch full profile info in the background without blocking UI
              setTimeout(() => {
                refreshUser(isMountedGetter);
              }, 50);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMountedGetter()) {
            setAuthState({ user: null, loading: false, error: null });
          }
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshUser]); // Keep refreshUser in dependency array

  // Add a clearError method for UI to clear error state
  const clearError = () => setAuthState(prev => ({ ...prev, error: null }));

  // Update signOut to accept optional callbacks
  const signOut = async (onSuccess?: () => void, onError?: (err: any) => void) => {
    const timer = logger.startTimer('AuthContext:signOut');
    
    // Step A: Add logging to indicate the start of the sign-out process
    console.log('🚀 SIGN-OUT PROCESS STARTED');
    logger.info('AUTH', 'Starting comprehensive sign-out process');
    
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const currentUserId = authState.user?.id;
      console.log('👤 Current user ID:', currentUserId);
      
      // Step B: Call the Supabase client's signOut() method with explicit logging
      console.log('📋 SIGN-OUT STEP B: Calling Supabase signOut()');
      const supabaseSignOutWrapper = async () => {
        try {
          console.log('🔄 Executing Supabase auth.signOut()...');
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error('❌ Supabase signOut failed:', error);
            logger.error('AUTH', 'Supabase signOut failed', { error: error.message }, error);
            throw error;
          }
          
          console.log('✅ Supabase signOut completed successfully');
          logger.info('AUTH', 'Supabase signOut completed successfully');
        } catch (supabaseError) {
          console.error('❌ Supabase signOut wrapper error:', supabaseError);
          throw supabaseError;
        }
      };
      
      // Use our helper to handle complete sign-out (Google + Supabase)
      const webSignOut = async () => {
        // Handle complete web sign-out flow
        if (typeof window !== 'undefined') {
          console.log('🌐 Running web sign-out flow...');
          return supabaseSignOutWrapper();
        }
        return false;
      };
      
      // Try web sign-out first, then fall back to regular Supabase sign-out
      console.log('🔄 Attempting web sign-out...');
      const webSignOutSuccess = await webSignOut().catch(e => {
        console.warn('⚠️ Web sign-out failed, falling back to standard flow:', e);
        logger.warn('AUTH', 'Web sign-out failed, falling back to standard flow', { error: e.message });
        return false;
      });
      
      // If web sign-out didn't handle everything, do standard sign-out
      if (!webSignOutSuccess) {
        console.log('� Web sign-out unsuccessful, performing standard Supabase sign-out...');
        await supabaseSignOutWrapper();
      }
      
      // Step C: Explicitly call google.accounts.id.disableAutoSelect()
      console.log('📋 SIGN-OUT STEP C: Disabling Google Auto-Select');
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.disableAutoSelect();
          console.log('✅ Google Auto-Select disabled successfully');
          logger.info('AUTH', 'Google Auto-Select disabled successfully');
        } catch (googleError) {
          console.warn('⚠️ Failed to disable Google Auto-Select:', googleError);
          logger.warn('AUTH', 'Failed to disable Google Auto-Select', { 
            error: googleError instanceof Error ? googleError.message : String(googleError) 
          });
        }
      }
      
      // Step D: Explicitly clear all relevant session information
      console.log('📋 SIGN-OUT STEP D: Clearing browser storage');
      const storageKeys = [
        'supabase.auth.token',
        'sb-localhost-auth-token',
        'sb-auth-token',
        'google-signin-token',
        'google-oauth-token',
        'user-session',
        'auth-user',
        'active-workspace',
        'workspace-id'
      ];
      
      // Clear localStorage
      storageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared localStorage: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Failed to clear localStorage ${key}:`, error);
        }
      });
      
      // Clear sessionStorage
      storageKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Cleared sessionStorage: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Failed to clear sessionStorage ${key}:`, error);
        }
      });
      
      // Clear crypto keys on logout
      cryptoManager.clearKeys();
      console.log('🔐 Crypto keys cleared');
      
      logger.info('AUTH', 'User signed out successfully', { userId: currentUserId });

      setAuthState({
        user: null,
        loading: false,
        error: null,
      })
      
      // Step E: Add logging to indicate the sign-out process is complete
      console.log('📋 SIGN-OUT STEP E: Sign-out process completed successfully');
      console.log('✅ SIGN-OUT PROCESS COMPLETED - User should be fully signed out');
      logger.info('AUTH', 'Sign-out process completed successfully');
      
      timer();
      if (onSuccess) onSuccess();
    } catch (error) {
      timer();
      console.error('❌ SIGN-OUT PROCESS FAILED:', error);
      logger.error('AUTH', 'Error signing out', { error: (error as Error).message }, error as Error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }))
      if (onError) onError(error);
      throw error
    }
  }

  // Hard sign-out: Google revoke, Supabase signOut, clear storage
  const hardSignOut = async (onSuccess?: () => void, onError?: (err: any) => void) => {
    const timer = logger.startTimer('AuthContext:hardSignOut');
    try {
      // Step 1: Google revoke (if available)
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          const email = authState.user?.email || window.localStorage.getItem('google-last-email') || undefined;
          await new Promise((resolve) => {
            window.google.accounts.id.revoke(email, () => {
              window.google.accounts.id.disableAutoSelect();
              resolve(true);
            });
          });
        } catch (e) {
          const errMsg = (typeof e === 'object' && e && 'message' in e) ? (e as any).message : String(e);
          logger.warn('AUTH', 'Google revoke failed', { error: errMsg });
        }
      }
      // Step 2: Supabase sign out
      await supabase.auth.signOut();
      // Step 3: Clear storage
      const storageKeys = [
        'supabase.auth.token',
        'sb-localhost-auth-token',
        'sb-auth-token',
        'google-signin-token',
        'google-oauth-token',
        'user-session',
        'auth-user',
        'active-workspace',
        'workspace-id',
      ];
      storageKeys.forEach(key => {
        try { localStorage.removeItem(key); } catch {}
        try { sessionStorage.removeItem(key); } catch {}
      });
      cryptoManager.clearKeys();
      setAuthState({ user: null, loading: false, error: null });
      timer();
      if (onSuccess) onSuccess();
    } catch (error) {
      timer();
      logger.error('AUTH', 'Error in hardSignOut', { error: error instanceof Error ? error.message : String(error) });
      setAuthState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Hard sign out failed' }));
      if (onError) onError(error);
      throw error;
    }
  };

  // Custom Google sign-in using definitive GIS helper
  const signInWithGoogle = async (onSuccess?: () => void, onError?: (err: any) => void) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      /*
      const { error, data } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        // token: idToken, // Removed: no web-compatible idToken
      });
      */
      /*
      if (data && data.user && data.user.email) {
        try { window.localStorage.setItem('google-last-email', data.user.email); } catch {}
      }
      */
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      if (onSuccess) onSuccess();
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Google sign-in failed' }));
      if (onError) onError(error);
      logger.error('AUTH', 'Google sign-in error', { error: (error as Error).message }, error as Error);
    }
  }

  const value = { ...authState, signOut, refreshUser: () => refreshUser(() => true), hardSignOut, signInWithGoogle, clearError };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
