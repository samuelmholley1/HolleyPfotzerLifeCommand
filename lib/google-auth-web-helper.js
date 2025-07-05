// google-auth-web-helper.js
/**
 * Helper functions for handling Google Authentication in web environments
 * Updated to use Google Identity Services API (GIS) instead of deprecated gapi.auth2
 */

// Load Google Identity Services script dynamically if not present
export function loadGoogleAuthScript() {
  if (typeof window !== 'undefined' && !window.google?.accounts?.id) {
    console.log('📦 Loading Google Identity Services script...');
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogleAuth();
    document.head.appendChild(script);
  } else if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    initGoogleAuth();
  }
}

// Initialize Google Identity Services
function initGoogleAuth() {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    console.log('🔧 Initializing Google Identity Services...');
    const clientId = process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID || '501068979540-gu0n7b8prt1epcvmklta9qr14l8ka.apps.googleusercontent.com';
    
    try {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: () => {}, // We'll handle this elsewhere
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      console.log('✅ Google Identity Services initialized successfully');
    } catch (error) {
      console.error('❌ Google Identity Services initialization error:', error);
    }
  }
}

// Handle complete sign out (both Google and Supabase)
export async function completeSignOut(supabaseSignOut) {
  try {
    console.log('🚀 Starting comprehensive sign-out process...');
    
    // Step A: Log the start of the sign-out process
    console.log('📋 Sign-out Step A: Initiating multi-step sign-out process');
    
    // Step B1: Disable Google Auto-Select to prevent automatic re-login
    console.log('📋 Sign-out Step B1: Disabling Google Auto-Select');
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
        console.log('✅ Google Auto-Select disabled successfully');
        // --- Revoke Google session for this app ---
        if (window.google.accounts.id.revoke && window.localStorage) {
          // Try to get the last signed-in email from localStorage or pass as param
          const lastEmail = window.localStorage.getItem('google-last-email') || undefined;
          if (lastEmail) {
            window.google.accounts.id.revoke(lastEmail, () => {
              console.log('✅ Google session revoked for', lastEmail);
            });
          } else {
            // If no email, try to revoke without param (may not work in all cases)
            window.google.accounts.id.revoke(undefined, () => {
              console.log('✅ Google session revoked (no email param)');
            });
          }
        }
      } catch (googleError) {
        console.warn('⚠️ Failed to disable Google Auto-Select or revoke:', googleError);
      }
    }
    
    // Step B2: Sign out from Google Identity Services (legacy fallback)
    console.log('📋 Sign-out Step B2: Attempting Google Identity Services sign-out');
    if (typeof window !== 'undefined' && window.gapi && window.gapi.auth2) {
      try {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance && authInstance.isSignedIn.get()) {
          console.log('🔄 Signing out from Google Auth2 (legacy)...');
          await authInstance.signOut();
          console.log('✅ Google Auth2 legacy sign-out successful');
        }
      } catch (googleError) {
        console.warn('⚠️ Google Auth2 legacy sign-out error:', googleError);
      }
    }

    // Step C: Call Supabase sign out
    console.log('📋 Sign-out Step C: Calling Supabase sign-out');
    if (supabaseSignOut && typeof supabaseSignOut === 'function') {
      try {
        await supabaseSignOut();
        console.log('✅ Supabase sign-out completed successfully');
      } catch (supabaseError) {
        console.error('❌ Supabase sign-out failed:', supabaseError);
        throw supabaseError;
      }
    }

    // Step D: Explicitly clear all relevant session information
    console.log('📋 Sign-out Step D: Clearing browser storage');
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
    
    // Clear all Supabase-related keys (pattern-based clearing)
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
          localStorage.removeItem(key);
          console.log(`�️ Pattern-cleared localStorage: ${key}`);
        }
      });
    } catch (error) {
      console.warn('⚠️ Failed to pattern-clear localStorage:', error);
    }
    
    // Step E: Log completion
    console.log('📋 Sign-out Step E: Sign-out process completed successfully');
    console.log('✅ Comprehensive sign-out process completed');
    
    return true;
  } catch (error) {
    console.error('❌ Complete sign-out error:', error);
    console.log('📋 Sign-out Step E: Sign-out process failed with error:', error.message);
    return false;
  }
}
