import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { AuthError, GoogleSignInResponse } from '../types/auth'

// Platform-specific imports
let GoogleSignin: any = null;
let statusCodes: any = null;
let isErrorWithCode: any = null;

if (Platform.OS !== 'web') {
  const googleSigninModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSigninModule.GoogleSignin;
  statusCodes = googleSigninModule.statusCodes;
  isErrorWithCode = googleSigninModule.isErrorWithCode;
}

class GoogleAuthService {
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      // Get client ID from environment variables
      const webClientId = process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_WEB_CLIENT_ID
      const iosClientId = process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID || process.env.GOOGLE_IOS_CLIENT_ID
      
      if (!webClientId) {
        throw new Error('Google Web Client ID not found in environment variables')
      }

      if (Platform.OS === 'web') {
        // Web initialization - we'll handle this in the sign-in method
        this.initialized = true
        console.log('Google Sign-In web mode initialized')
        return
      }

      if (!GoogleSignin) {
        throw new Error('Google Sign-In not available on this platform')
      }

      await GoogleSignin.configure({
        webClientId: webClientId,
        iosClientId: iosClientId, // Only needed for iOS
        offlineAccess: true,
        hostedDomain: '', // Optional: restrict to specific domain
        forceCodeForRefreshToken: true,
        accountName: '', // Optional: pre-fill account name
        googleServicePlistPath: '', // Optional: iOS plist path
      })

      this.initialized = true
      console.log('Google Sign-In initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error)
      throw error
    }
  }

  async signIn(): Promise<GoogleSignInResponse> {
    if (Platform.OS === 'web') {
      return this.signInWeb()
    }
    return this.signInNative()
  }

  private async signInWeb(): Promise<GoogleSignInResponse> {
    try {
      // For web, we'll use a mock response for now
      // In a real implementation, you'd use the Google Identity Services API
      throw new Error('Web Google Sign-In not fully implemented yet. Please configure your actual Supabase credentials and use the native app.')
    } catch (error) {
      throw new Error(`Web Google Sign-In failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async signInNative(): Promise<GoogleSignInResponse> {
    try {
      await this.initialize()

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices()

      // Perform the sign-in
      const userInfo = await GoogleSignin.signIn()
      
      // Get the ID token
      const tokens = await GoogleSignin.getTokens()
      
      if (!tokens.idToken) {
        throw new Error('No ID token received from Google')
      }

      // Sign in with Supabase using the Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.idToken,
      })

      if (error) {
        throw new Error(`Supabase authentication failed: ${error.message}`)
      }

      if (!data.user) {
        throw new Error('No user data returned from Supabase')
      }

      // Format user data
      const authUser = {
        id: data.user.id,
        email: data.user.email || null,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
        avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
        provider: 'google' as const,
        created_at: data.user.created_at,
      }

      console.log('Google Sign-In successful:', authUser)

      return {
        user: authUser,
        session: data.session,
      }

    } catch (error) {
      console.error('Google Sign-In error:', error)
      
      if (isErrorWithCode && error && isErrorWithCode(error)) {
        switch ((error as any).code) {
          case statusCodes?.SIGN_IN_CANCELLED:
            throw new Error('Sign-in was cancelled')
          case statusCodes?.IN_PROGRESS:
            throw new Error('Sign-in is already in progress')
          case statusCodes?.PLAY_SERVICES_NOT_AVAILABLE:
            throw new Error('Google Play Services not available')
          default:
            throw new Error(`Google Sign-In failed: ${(error as any).message}`)
        }
      }
      
      throw error
    }
  }

  async signOut(): Promise<void> {
    console.log('🚀 GoogleAuth Service: Initiating sign-out process...');
    try {
      // Step A: Log the start of the sign-out process
      console.log('📋 GoogleAuth Step A: Starting Google-specific sign-out');
      
      if (Platform.OS !== 'web' && GoogleSignin) {
        console.log('📱 Mobile platform detected - using React Native Google Sign-in');
        console.log('🔄 Revoking Google access...');
        await GoogleSignin.revokeAccess();
        console.log('✅ Google access revoked successfully');
        
        console.log('🔄 Signing out from Google...');
        await GoogleSignin.signOut();
        console.log('✅ Google sign-out completed successfully');
      } else {
        console.log('🌐 Web platform detected - using Google Identity Services');
        
        // Step C: Explicitly call google.accounts.id.disableAutoSelect()
        if (typeof window !== 'undefined' && window.google?.accounts?.id) {
          console.log('🔄 Disabling Google Auto-Select...');
          try {
            window.google.accounts.id.disableAutoSelect();
            console.log('✅ Google Auto-Select disabled successfully');
          } catch (error) {
            console.warn('⚠️ Failed to disable Google Auto-Select:', error);
          }
        }
        
        // Legacy support for gapi.auth2
        if (typeof window !== 'undefined' && window.gapi && window.gapi.auth2) {
          console.log('🔄 Attempting legacy Google Auth2 sign-out...');
          try {
            const authInstance = window.gapi.auth2.getAuthInstance();
            if (authInstance && authInstance.isSignedIn.get()) {
              await authInstance.signOut();
              console.log('✅ Legacy Google Auth2 sign-out successful');
            }
          } catch (error) {
            console.warn('⚠️ Legacy Google Auth2 sign-out error:', error);
          }
        }
      }
      
      // Step B: Call Supabase sign-out
      console.log('📋 GoogleAuth Step B: Calling Supabase sign-out');
      console.log('🔄 Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Supabase sign-out error:', error);
        throw error;
      }

      console.log('✅ Supabase sign-out completed successfully');
      console.log('📋 GoogleAuth Step E: Google sign-out process completed successfully');
    } catch (error) {
      console.error('❌ An error occurred during the sign-out process:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const userInfo = await GoogleSignin.signInSilently()
      return userInfo
    } catch (error) {
      console.log('No current Google user found')
      return null
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser()
      return currentUser !== null
    } catch (error) {
      return false
    }
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService()
