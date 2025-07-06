// components/DiagnosticInfo.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUserWorkspace } from '../hooks/useUserWorkspace';

export const DiagnosticInfo: React.FC = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const { workspaceId, loading: workspaceLoading, error: workspaceError } = useUserWorkspace();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diagnostic Information</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication:</Text>
        <Text style={styles.item}>Loading: {authLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.item}>Error: {authError || 'None'}</Text>
        <Text style={styles.item}>User ID: {user?.id || 'None'}</Text>
        <Text style={styles.item}>User Email: {user?.email || 'None'}</Text>
        <Text style={styles.item}>Active Workspace ID: {user?.active_workspace_id || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workspace:</Text>
        <Text style={styles.item}>Loading: {workspaceLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.item}>Error: {workspaceError || 'None'}</Text>
        <Text style={styles.item}>Workspace ID: {workspaceId || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment:</Text>
        <Text style={styles.item}>Supabase URL: {process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing'}</Text>
        <Text style={styles.item}>Supabase Key: {process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</Text>
        <Text style={styles.item}>Google Client ID: {process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID ? 'Set' : 'Missing'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  item: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});
