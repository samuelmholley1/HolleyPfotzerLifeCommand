// components/SupabaseTest.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [details, setDetails] = useState<string[]>([]);

  const testConnection = async () => {
    const newDetails: string[] = [];
    
    try {
      newDetails.push('Starting Supabase connection test...');
      
      // Test 1: Basic client creation
      if (supabase) {
        newDetails.push('✅ Supabase client created successfully');
      } else {
        newDetails.push('❌ Supabase client failed to create');
        setConnectionStatus('Failed');
        setDetails(newDetails);
        return;
      }

      // Test 2: Environment variables
      const url = process.env.REACT_APP_SUPABASE_URL;
      const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      if (url && key) {
        newDetails.push(`✅ Environment variables loaded: URL=${url.substring(0, 20)}...`);
      } else {
        newDetails.push('❌ Environment variables missing');
        setConnectionStatus('Failed');
        setDetails(newDetails);
        return;
      }

      // Test 3: Simple query (should work even without auth)
      try {
        const { data, error } = await Promise.race([
          supabase.from('profiles').select('count').limit(0),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]) as any;
        
        if (error) {
          newDetails.push(`⚠️ Query error (expected if not authenticated): ${error.message}`);
        } else {
          newDetails.push('✅ Basic query executed successfully');
        }
      } catch (queryError) {
        newDetails.push(`⚠️ Query timeout or error: ${(queryError as Error).message}`);
      }

      // Test 4: Auth state
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          newDetails.push('✅ User is authenticated');
        } else {
          newDetails.push('ℹ️ User is not authenticated (expected for new users)');
        }
      } catch (authError) {
        newDetails.push(`⚠️ Auth check error: ${(authError as Error).message}`);
      }

      setConnectionStatus('Test completed');
      
    } catch (error) {
      newDetails.push(`❌ Connection test failed: ${(error as Error).message}`);
      setConnectionStatus('Failed');
    }
    
    setDetails(newDetails);
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      <Text style={styles.status}>Status: {connectionStatus}</Text>
      
      <View style={styles.detailsContainer}>
        {details.map((detail, index) => (
          <Text key={index} style={styles.detail}>{detail}</Text>
        ))}
      </View>
      
      <TouchableOpacity style={styles.button} onPress={testConnection}>
        <Text style={styles.buttonText}>Retry Test</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#444',
  },
  detailsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
  },
  detail: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
    color: '#555',
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
