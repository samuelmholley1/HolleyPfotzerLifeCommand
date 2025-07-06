import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { database, Clarification } from '../lib/db';
import { clarificationService } from '../services/clarificationService';
import { useAuth } from '../contexts/AuthContext';
import { useUserWorkspace } from '../hooks/useUserWorkspace';

interface ResponseSelection {
  [clarificationId: string]: {
    [assumptionIndex: number]: 'agree' | 'needs_discussion';
  };
}

export const PendingClarificationList: React.FC = () => {
  const [pendingClarifications, setPendingClarifications] = useState<Clarification[]>([]);
  const [responses, setResponses] = useState<ResponseSelection>({});
  const [loading, setLoading] = useState(true);
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { workspaceId } = useUserWorkspace();
  const isDarkMode = useColorScheme() === 'dark';

  const themeStyles = useMemo(() => ({
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
    textColor: isDarkMode ? '#fff' : '#000',
    cardBackground: isDarkMode ? '#2a2a2a' : '#f9f9f9',
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    buttonBackground: isDarkMode ? '#0066cc' : '#007AFF',
    buttonText: '#fff',
    agreeButton: '#4CAF50',
    discussButton: '#FF9800',
    selectedButton: isDarkMode ? '#0088ff' : '#005bb5',
  }), [isDarkMode]);

  // Fetch pending clarifications on component mount
  useEffect(() => {
    const fetchPendingClarifications = async () => {
      if (!user?.id || !workspaceId) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const clarifications = await clarificationService.getPendingClarifications(database, {
          workspaceId,
          userId: user.id,
        });
        
        setPendingClarifications(clarifications);
        
        // Initialize response state for each clarification
        const initialResponses: ResponseSelection = {};
        clarifications.forEach(clarification => {
          initialResponses[clarification.id] = {};
        });
        setResponses(initialResponses);
        
      } catch (err) {
        console.error('Failed to fetch pending clarifications:', err);
        setError('Failed to load pending clarifications. Please try again.');
        Alert.alert('Error', 'Failed to load pending clarifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingClarifications();
  }, [user?.id, workspaceId]);

  // Handle response selection for a specific assumption
  const handleResponseSelection = useCallback((
    clarificationId: string,
    assumptionIndex: number,
    response: 'agree' | 'needs_discussion'
  ) => {
    setResponses(prev => ({
      ...prev,
      [clarificationId]: {
        ...prev[clarificationId],
        [assumptionIndex]: response,
      },
    }));
  }, []);

  // Check if all assumptions have been responded to for a clarification
  const isResponseComplete = useCallback((clarification: Clarification): boolean => {
    const assumptions = clarification.getAssumptionsArray();
    const clarificationResponses = responses[clarification.id] || {};
    
    return assumptions.every((_, index) => 
      clarificationResponses[index] === 'agree' || 
      clarificationResponses[index] === 'needs_discussion'
    );
  }, [responses]);

  // Submit responses for a clarification
  const handleSubmitResponse = useCallback(async (clarification: Clarification) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to submit responses.');
      return;
    }

    // Security validation: Ensure clarification belongs to current workspace
    if (clarification.workspaceId !== workspaceId) {
      console.error('Security violation: Clarification workspace mismatch', {
        clarificationWorkspace: clarification.workspaceId,
        currentWorkspace: workspaceId,
        userId: user.id
      });
      Alert.alert('Error', 'Invalid clarification. Please refresh and try again.');
      return;
    }

    // Security validation: Ensure user is not responding to their own clarification
    if (clarification.proposerId === user.id) {
      console.error('Security violation: User attempting to respond to own clarification', {
        clarificationId: clarification.id,
        userId: user.id
      });
      Alert.alert('Error', 'You cannot respond to your own clarification.');
      return;
    }

    // Prevent double submission
    if (submittingIds.has(clarification.id)) {
      console.warn('Submission already in progress for clarification:', clarification.id);
      return;
    }

    try {
      setSubmittingIds(prev => new Set(prev).add(clarification.id));
      
      const clarificationResponses = responses[clarification.id];
      await clarificationService.submitResponse(database, {
        clarification,
        responses: clarificationResponses,
        responderId: user.id,
      });

      // Remove the clarification from the pending list
      setPendingClarifications(prev => 
        prev.filter(c => c.id !== clarification.id)
      );

      // Clean up the responses state
      setResponses(prev => {
        const newResponses = { ...prev };
        delete newResponses[clarification.id];
        return newResponses;
      });

      Alert.alert('Success', 'Your responses have been submitted successfully!');
      
    } catch (err) {
      console.error('Failed to submit responses:', err);
      Alert.alert('Error', 'Failed to submit responses. Please try again.');
    } finally {
      // Ensure we always clean up the submitting state
      setSubmittingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(clarification.id);
        return newSet;
      });
    }
  }, [user?.id, responses, submittingIds, workspaceId]);

  // Render a single assumption with response buttons
  const renderAssumption = (
    assumption: string,
    index: number,
    clarificationId: string
  ) => {
    const selectedResponse = responses[clarificationId]?.[index];
    
    return (
      <View key={index} style={styles.assumptionContainer}>
        <Text style={[styles.assumptionText, { color: themeStyles.textColor }]}>
          {index + 1}. {assumption}
        </Text>
        
        <View style={styles.responseButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.responseButton,
              {
                backgroundColor: selectedResponse === 'agree' 
                  ? themeStyles.selectedButton 
                  : themeStyles.agreeButton,
              },
            ]}
            onPress={() => handleResponseSelection(clarificationId, index, 'agree')}
            accessibilityLabel={`Agree with assumption ${index + 1}`}
            accessibilityHint="Mark this assumption as agreed"
            accessibilityRole="button"
          >
            <Text style={[styles.responseButtonText, { color: themeStyles.buttonText }]}>
              Agree
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.responseButton,
              {
                backgroundColor: selectedResponse === 'needs_discussion' 
                  ? themeStyles.selectedButton 
                  : themeStyles.discussButton,
              },
            ]}
            onPress={() => handleResponseSelection(clarificationId, index, 'needs_discussion')}
            accessibilityLabel={`Mark assumption ${index + 1} as needing discussion`}
            accessibilityHint="Mark this assumption as needing further discussion"
            accessibilityRole="button"
          >
            <Text style={[styles.responseButtonText, { color: themeStyles.buttonText }]}>
              Needs Discussion
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render a single clarification card
  const renderClarificationCard = (clarification: Clarification) => {
    const assumptions = clarification.getAssumptionsArray();
    const isComplete = isResponseComplete(clarification);
    const isSubmitting = submittingIds.has(clarification.id);
    
    // Handle edge case: clarification with no assumptions
    if (assumptions.length === 0) {
      return (
        <View 
          key={clarification.id} 
          style={[
            styles.clarificationCard,
            {
              backgroundColor: themeStyles.cardBackground,
              borderColor: themeStyles.borderColor,
            },
          ]}
        >
          <Text style={[styles.topicTitle, { color: themeStyles.textColor }]}>
            {clarification.topic}
          </Text>
          
          <Text style={[styles.errorText, { color: '#ff4444' }]}>
            This clarification has no assumptions to review.
          </Text>
        </View>
      );
    }
    
    return (
      <View 
        key={clarification.id} 
        style={[
          styles.clarificationCard,
          {
            backgroundColor: themeStyles.cardBackground,
            borderColor: themeStyles.borderColor,
          },
        ]}
      >
        <Text style={[styles.topicTitle, { color: themeStyles.textColor }]}>
          {clarification.topic}
        </Text>
        
        <Text style={[styles.assumptionsHeader, { color: themeStyles.textColor }]}>
          Please respond to each assumption:
        </Text>
        
        {assumptions.map((assumption, index) =>
          renderAssumption(assumption, index, clarification.id)
        )}
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: isComplete && !isSubmitting 
                ? themeStyles.buttonBackground 
                : '#999',
            },
          ]}
          onPress={() => handleSubmitResponse(clarification)}
          disabled={!isComplete || isSubmitting}
          accessibilityLabel="Submit your responses to this clarification"
          accessibilityHint={isComplete ? "Submit all responses" : "Complete all responses before submitting"}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={themeStyles.buttonText} />
          ) : (
            <Text style={[styles.submitButtonText, { color: themeStyles.buttonText }]}>
              Submit Response
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeStyles.backgroundColor }]}>
        <ActivityIndicator size="large" color={themeStyles.buttonBackground} />
        <Text style={[styles.loadingText, { color: themeStyles.textColor }]}>
          Loading pending clarifications...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: themeStyles.backgroundColor }]}>
        <Text style={[styles.errorText, { color: '#ff4444' }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: themeStyles.buttonBackground }]}
          onPress={() => {
            setError(null);
            setLoading(true);
            // Re-trigger the useEffect by updating a dependency
            const fetchPendingClarifications = async () => {
              if (!user?.id || !workspaceId) {
                setLoading(false);
                return;
              }

              try {
                setError(null);
                const clarifications = await clarificationService.getPendingClarifications(database, {
                  workspaceId,
                  userId: user.id,
                });
                
                setPendingClarifications(clarifications);
                
                const initialResponses: ResponseSelection = {};
                clarifications.forEach(clarification => {
                  initialResponses[clarification.id] = {};
                });
                setResponses(initialResponses);
                
              } catch (err) {
                console.error('Failed to fetch pending clarifications:', err);
                setError('Failed to load pending clarifications. Please try again.');
              } finally {
                setLoading(false);
              }
            };
            fetchPendingClarifications();
          }}
        >
          <Text style={[styles.retryButtonText, { color: themeStyles.buttonText }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (pendingClarifications.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: themeStyles.backgroundColor }]}>
        <Text style={[styles.emptyText, { color: themeStyles.textColor }]}>
          No pending clarifications at this time.
        </Text>
        <Text style={[styles.emptySubtext, { color: themeStyles.textColor }]}>
          Check back later for new assumption clarifications that need your input.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.headerTitle, { color: themeStyles.textColor }]}>
        Pending Clarifications ({pendingClarifications.length})
      </Text>
      
      {pendingClarifications.map(renderClarificationCard)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  clarificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  assumptionsHeader: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  assumptionContainer: {
    marginBottom: 16,
  },
  assumptionText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  responseButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  responseButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  responseButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default PendingClarificationList;

/*
Integration Example:

1. Import into CommunicationDashboard.tsx:
import { PendingClarificationList } from './PendingClarificationList';

2. Add to the dashboard interface (consider adding a tab or section):
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Pending Clarifications</Text>
  <PendingClarificationList />
</View>

3. Or add as a separate tab in MainTabNavigator.tsx:
- Update TabName type: 'briefing' | 'events' | 'tasks' | 'goals' | 'communication' | 'clarifications'
- Add case in renderContent:
  case 'clarifications':
    return <PendingClarificationList />;
- Add tab button:
  {renderTabButton('clarifications', 'Clarifications', '💬')}

4. The component automatically:
- Fetches pending clarifications for the current workspace
- Excludes clarifications proposed by the current user
- Handles response collection and submission
- Updates the clarification status based on responses
- Syncs to backend when available
*/
