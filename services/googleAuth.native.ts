// Native implementation using @react-native-google-signin/google-signin
import { GoogleSignin, statusCodes, User } from '@react-native-google-signin/google-signin';
import { GoogleAuthService, GoogleAuthResult, GoogleUser } from './googleAuth.interface';

class NativeGoogleAuthService implements GoogleAuthService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const webClientId = process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID;
    
    if (!webClientId) {
      throw new Error('Google Web Client ID not found in environment variables');
    }

    GoogleSignin.configure({
      webClientId,
      iosClientId,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });

    this.initialized = true;
  }

  async signIn(): Promise<GoogleAuthResult> {
    await this.initialize();
    
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const user: GoogleUser = {
        id: userInfo.data?.user.id || '',
        email: userInfo.data?.user.email || '',
        name: userInfo.data?.user.name || '',
        photo: userInfo.data?.user.photo || undefined,
      };

      return {
        user,
        idToken: userInfo.data?.idToken || '',
        accessToken: undefined, // Access token handling may vary
      };
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      }
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await GoogleSignin.signOut();
  }

  async isSignedIn(): Promise<boolean> {
    const isSignedIn = await GoogleSignin.hasPreviousSignIn();
    return isSignedIn;
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      if (!userInfo.data?.user) return null;

      return {
        id: userInfo.data.user.id,
        email: userInfo.data.user.email,
        name: userInfo.data.user.name || '',
        photo: userInfo.data.user.photo || undefined,
      };
    } catch {
      return null;
    }
  }
}

export const googleAuthService = new NativeGoogleAuthService();
