import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import DevLogin from './DevLogin';
import { useAuth } from '../contexts/AuthContext';

// Web-compatible Platform object
const Platform = {
  OS: 'web' as const,
  select: (platforms: { web?: any; default?: any }) => platforms.web || platforms.default
};

interface GoogleSignInProps {
  onSignInSuccess?: (user: any) => void;
  onSignInError?: (error: string) => void;
  style?: any;
  disabled?: boolean;
}

export const GoogleSignInComponent: React.FC<GoogleSignInProps> = ({
  onSignInSuccess,
  onSignInError,
  style,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [isGapiReady, setIsGapiReady] = useState(false);
  const { signInWithGoogle, error } = useAuth();

  useEffect(() => {
    setIsGapiReady(true);
  }, []);

  const handleSignIn = async () => {
    if (loading || disabled || !isGapiReady) return;
    setLoading(true);
    try {
      // Use AuthContext's signInWithGoogle, which should call Supabase's signInWithOAuth
      await signInWithGoogle();
      // No need to handle success here; Supabase will redirect
    } catch (error) {
      console.error('Error triggering Google sign-in:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign-in failed';
      Alert.alert('Sign-In Failed', errorMessage, [{ text: 'OK' }]);
      onSignInError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      Alert.alert('Signed Out', 'You have been signed out successfully', [{ text: 'OK' }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-out failed';
      Alert.alert('Sign-Out Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.signInButton, (disabled || !isGapiReady) && styles.disabled]}
        onPress={handleSignIn}
        disabled={disabled || loading || !isGapiReady}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.signInButtonText}>
              {!isGapiReady ? 'Loading...' : 'Sign in with Google'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      {/* Dev-only login form */}
      {typeof __DEV__ !== 'undefined' && __DEV__ && <DevLogin />}
      <TouchableOpacity
        style={[styles.signOutButton, { marginTop: 10 }]}
        onPress={handleSignOut}
        disabled={loading}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorBox: {
    backgroundColor: '#ffeaea',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffb3b3',
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 200,
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  signOutText: {
    color: '#666',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
});
