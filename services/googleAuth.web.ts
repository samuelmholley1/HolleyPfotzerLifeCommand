// Web implementation using Google Identity Services
import { GoogleAuthService, GoogleAuthResult, GoogleUser } from './googleAuth.interface';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

class WebGoogleAuthService implements GoogleAuthService {
  private initialized = false;
  private clientId: string = '';

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.clientId = process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID || '';
    
    if (!this.clientId) {
      throw new Error('Google Web Client ID not found in environment variables');
    }

    // Load Google Identity Services
    await this.loadGoogleScript();
    await this.loadGapiScript();
    
    // Initialize gapi
    await new Promise<void>((resolve) => {
      window.gapi.load('auth2', async () => {
        await window.gapi.auth2.init({
          client_id: this.clientId,
        });
        resolve();
      });
    });

    this.initialized = true;
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<GoogleAuthResult> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      authInstance.signIn().then((googleUser: any) => {
        const profile = googleUser.getBasicProfile();
        const authResponse = googleUser.getAuthResponse();

        const user: GoogleUser = {
          id: profile.getId(),
          email: profile.getEmail(),
          name: profile.getName(),
          photo: profile.getImageUrl(),
        };

        resolve({
          user,
          idToken: authResponse.id_token,
          accessToken: authResponse.access_token,
        });
      }).catch(reject);
    });
  }

  async signOut(): Promise<void> {
    if (!this.initialized) return;
    
    const authInstance = window.gapi.auth2.getAuthInstance();
    await authInstance.signOut();
  }

  async isSignedIn(): Promise<boolean> {
    if (!this.initialized) return false;
    
    const authInstance = window.gapi.auth2.getAuthInstance();
    return authInstance.isSignedIn.get();
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    if (!this.initialized) return null;
    
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) return null;

    const googleUser = authInstance.currentUser.get();
    const profile = googleUser.getBasicProfile();

    return {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      photo: profile.getImageUrl(),
    };
  }
}

export const googleAuthService = new WebGoogleAuthService();
