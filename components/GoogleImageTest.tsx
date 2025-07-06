// Test component to debug Google profile image loading
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const GoogleImageTest: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  
  // Get the actual user's avatar URL
  const userAvatarUrl = user?.avatar_url;
  
  // Create test variations of the user's actual URL
  const createTestUrls = (originalUrl: string | null | undefined): string[] => {
    if (!originalUrl) return [];
    
    if (originalUrl.includes('googleusercontent.com')) {
      const baseUrl = originalUrl.split('=')[0];
      return [
        originalUrl, // Original
        `${baseUrl}=s96-c`, // Simple format
        `${baseUrl}=s96-c-k-no`, // No outline
        `${baseUrl}=s96-c-k-no-il`, // No outline, no link
        `${baseUrl}?sz=96`, // Query parameter format
        `${baseUrl}=s96`, // Basic size only
      ];
    }
    
    return [originalUrl];
  };

  const testUrls = createTestUrls(userAvatarUrl);

  const testImageUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      const img = document.createElement('img');
      img.onload = () => {
        setTestResults(prev => [...prev, `✅ SUCCESS: ${url}`]);
      };
      img.onerror = (error) => {
        setTestResults(prev => [...prev, `❌ FAILED: ${url} - ${error}`]);
      };
      img.src = url;
      
      // Add timeout
      setTimeout(() => {
        if (!img.complete) {
          setTestResults(prev => [...prev, `⏰ TIMEOUT: ${url}`]);
        }
      }, 3000);
    }
  };

  const runTests = () => {
    setTestResults(['🔄 Starting image URL tests...']);
    testUrls.forEach(url => testImageUrl(url));
  };

  return (
    <ScrollView style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10, maxHeight: 400 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
        Google Image URL Debug Component
      </Text>
      
      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>User Info:</Text>
        <Text style={{ fontSize: 12 }}>Name: {user?.name || 'No name'}</Text>
        <Text style={{ fontSize: 12 }}>Email: {user?.email || 'No email'}</Text>
        <Text style={{ fontSize: 12, marginBottom: 5 }}>Avatar URL: {userAvatarUrl || 'No avatar URL'}</Text>
      </View>
      
      <TouchableOpacity 
        onPress={runTests}
        style={{ backgroundColor: '#007AFF', padding: 10, borderRadius: 5, marginBottom: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>Test User&apos;s Avatar URLs</Text>
      </TouchableOpacity>
      
      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={{ fontSize: 10, marginBottom: 2, fontFamily: 'monospace' }}>
            {result}
          </Text>
        ))}
      </View>
      
      <View>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Direct Image Tests:</Text>
        {testUrls.map((url, index) => (
          <View key={index} style={{ marginVertical: 5, borderWidth: 1, borderColor: '#ddd', padding: 5 }}>
            <Text style={{ fontSize: 8, marginBottom: 2 }}>{url}</Text>
            <Image 
              source={{ uri: url }}
              style={{ width: 40, height: 40, backgroundColor: '#ccc', borderRadius: 20 }}
              onError={(error: any) => console.log(`❌ Image failed: ${url}`, error)}
              onLoad={() => console.log(`✅ Image loaded: ${url}`)}
              alt="Test avatar image"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
