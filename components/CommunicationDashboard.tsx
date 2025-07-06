import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { EmergencyBreakButton } from './EmergencyBreakButton';
import { AssumptionClarification } from './AssumptionClarification';
import { PendingClarificationList } from './PendingClarificationList';
import { 
  communicationStateManager, 
  CommunicationMode, 
  CommunicationEvent,
  CommunicationModeType 
} from '../services/communication-state-manager';
import { clarificationService } from '../services/clarificationService';
import { communicationAnalyticsService } from '../services/CommunicationAnalyticsService';
import { CommunicationService } from '../lib/services/communicationService';
import { useAuth } from '../contexts/AuthContext';
import { database } from '../lib/db';

interface CommunicationDashboardProps {
  workspaceId: string;
}

export const CommunicationDashboard: React.FC<CommunicationDashboardProps> = ({
  workspaceId
}) => {
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState<CommunicationMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentEvents, setRecentEvents] = useState<CommunicationEvent[]>([]);
  
  // Analytics state tracking
  const [analyticsState, setAnalyticsState] = useState<{
    strainLevel: 'calm' | 'mild' | 'tense' | 'critical';
    confidence: number;
    lastAnalysis: Date | null;
    isActive: boolean;
  }>({
    strainLevel: 'calm',
    confidence: 0,
    lastAnalysis: null,
    isActive: false
  });

  const loadCurrentState = useCallback(async () => {
    try {
      setLoading(true);
      const mode = await communicationStateManager.getCurrentMode(workspaceId);
      setCurrentMode(mode);
    } catch (error) {
      console.error('Error loading communication state:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !user) return;

    loadCurrentState();
    
    // Subscribe to real-time changes
    const modeSubscription = communicationStateManager.subscribeToModeChanges(
      workspaceId,
      handleModeChange
    );
    
    const eventsSubscription = communicationStateManager.subscribeToEvents(
      workspaceId,
      handleNewEvent
    );

    return () => {
      modeSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
    };
  }, [workspaceId, user, loadCurrentState]);

  const handleModeChange = (mode: CommunicationMode) => {
    setCurrentMode(mode);
    
    // Show notification for mode changes
    if (mode.current_mode === 'emergency_break') {
      Alert.alert(
        'Emergency Break Activated',
        'Communication has been paused. Take time to reset.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNewEvent = (event: CommunicationEvent) => {
    setRecentEvents(prev => [event, ...prev.slice(0, 4)]); // Keep last 5 events
  };

  const handleEmergencyBreak = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to use this feature');
      return;
    }

    try {
      await communicationStateManager.activateEmergencyBreak(
        workspaceId,
        user.id,
        {
          trigger: 'manual_button_press',
          location: 'communication_dashboard'
        }
      );
    } catch (error) {
      console.error('Emergency break failed:', error);
      throw error;
    }
  };

  const handleAcknowledgeBreak = async () => {
    if (!user) return;

    try {
      await communicationStateManager.acknowledgeBreak(workspaceId, user.id);
      Alert.alert(
        'Break Acknowledged',
        'Your partner will be notified that you acknowledge the break.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to acknowledge break:', error);
      Alert.alert('Error', 'Failed to acknowledge break. Please try again.');
    }
  };

  const handleResumeNormal = async () => {
    if (!user) return;

    Alert.alert(
      'Resume Communication',
      'Are you both ready to resume normal communication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            try {
              await communicationStateManager.resumeNormalMode(workspaceId, user.id);
              Alert.alert(
                'Communication Resumed',
                'Normal communication has been restored.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Failed to resume normal mode:', error);
              Alert.alert('Error', 'Failed to resume communication. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleProposeConversation = async (topic: string, assumptions: string[]) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to propose a conversation.');
      return;
    }

    try {
      await clarificationService.proposeConversation(database, {
        topic,
        assumptions,
        workspaceId,
        proposerId: user.id
      });
      // Success feedback is now handled by the AssumptionClarification component
    } catch (error) {
      console.error('Failed to propose conversation:', error);
      // Re-throw error so the component can handle it
      throw new Error('Failed to send conversation proposal. Please try again.');
    }
  };

  const getModeDisplay = (mode: CommunicationModeType): { text: string; color: string; description: string } => {
    switch (mode) {
      case 'normal':
        return {
          text: 'Normal',
          color: '#4CAF50',
          description: 'Communication is flowing normally'
        };
      case 'careful':
        return {
          text: 'Careful Mode',
          color: '#FF9800',
          description: 'Extra attention to communication patterns'
        };
      case 'emergency_break':
        return {
          text: 'Emergency Break',
          color: '#F44336',
          description: 'Communication is paused for reset'
        };
      case 'mediated':
        return {
          text: 'Mediated',
          color: '#9C27B0',
          description: 'Structured communication with guidelines'
        };
      default:
        return {
          text: 'Unknown',
          color: '#757575',
          description: 'Status unclear'
        };
    }
  };

  // Analytics integration - periodic communication strain monitoring
  useEffect(() => {
    if (!workspaceId || !user) return;

    // CRITICAL: Add race condition protection
    let isAnalysisRunning = false;
    let lastAlertTime = 0;
    const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes between critical alerts

    // Function to analyze and update communication state
    const runAnalyticsCheck = async () => {
      // CRITICAL: Prevent multiple concurrent analyses
      if (isAnalysisRunning) {
        console.log('[Analytics] Skipping analysis - already running');
        return;
      }

      isAnalysisRunning = true;

      try {
        console.log('[Analytics] Running communication strain analysis...', {
          workspaceId,
          timestamp: new Date().toISOString()
        });

        // Update analytics state to show it's running
        setAnalyticsState(prev => ({ ...prev, isActive: true }));

        // Run analytics to detect communication strain with timeout protection
        const ANALYSIS_TIMEOUT = 30 * 1000; // 30 seconds timeout
        const analysisPromise = communicationAnalyticsService.analyzeRecentEvents(
          database,
          workspaceId,
          {
            timeWindowMinutes: 15, // Analyze last 15 minutes
            enableDetailedLogging: false // Keep background checks quiet
          }
        );

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), ANALYSIS_TIMEOUT)
        );

        const analysisResult = await Promise.race([analysisPromise, timeoutPromise]);

        console.log('[Analytics] Analysis completed:', {
          strainLevel: analysisResult.strainLevel,
          confidence: analysisResult.confidence,
          factors: analysisResult.factors
        });

        // Update analytics state with results - OPTIMIZED: Only update if changed
        setAnalyticsState(prev => {
          // Prevent unnecessary re-renders if values haven't changed
          if (prev.strainLevel === analysisResult.strainLevel && 
              prev.confidence === analysisResult.confidence &&
              prev.isActive === false) {
            return { ...prev, lastAnalysis: new Date() }; // Only update timestamp
          }
          
          return {
            strainLevel: analysisResult.strainLevel,
            confidence: analysisResult.confidence,
            lastAnalysis: new Date(),
            isActive: false
          };
        });

        // Update shared communication state if strain level changed
        const updateResult = await CommunicationService.updateSharedCommunicationState(
          database,
          {
            workspaceId,
            newState: analysisResult.strainLevel
          }
        );

        if (updateResult.success) {
          console.log('[Analytics] Successfully updated communication state:', {
            workspaceId,
            newState: analysisResult.strainLevel,
            confidence: analysisResult.confidence
          });
        } else {
          console.warn('[Analytics] Failed to update communication state:', updateResult.error);
        }

        // CRITICAL: Prevent alert spam with cooldown
        const now = Date.now();
        const shouldShowAlert = analysisResult.strainLevel === 'critical' 
          && analysisResult.confidence > 70 
          && (now - lastAlertTime) > ALERT_COOLDOWN;

        if (shouldShowAlert) {
          lastAlertTime = now;
          Alert.alert(
            'Communication Strain Detected',
            `High strain detected with ${analysisResult.confidence}% confidence. Consider taking a break.`,
            [
              { text: 'Dismiss', style: 'cancel' },
              { 
                text: 'View Details', 
                onPress: () => {
                  Alert.alert(
                    'Strain Analysis Details',
                    `Factors:\n${analysisResult.factors.join('\n')}\n\nConfidence: ${analysisResult.confidence}%`
                  );
                }
              }
            ]
          );
        }

      } catch (error) {
        console.error('[Analytics] Failed to run communication strain analysis:', error);
        // Update state to show error occurred
        setAnalyticsState(prev => ({ 
          ...prev, 
          isActive: false,
          lastAnalysis: new Date()
        }));
        // Don't show alerts for background failures to avoid disrupting user experience
      } finally {
        // CRITICAL: Always reset the running flag
        isAnalysisRunning = false;
      }
    };

    // Run initial analysis after a short delay
    const initialTimeout = setTimeout(runAnalyticsCheck, 5000); // 5 seconds delay

    // Set up periodic analysis every 60 seconds
    const analyticsInterval = setInterval(runAnalyticsCheck, 60 * 1000); // 60 seconds

    console.log('[Analytics] Started periodic communication strain monitoring', {
      workspaceId,
      intervalSeconds: 60,
      initialDelaySeconds: 5
    });

    // Cleanup function - CRUCIAL to prevent memory leaks
    return () => {
      console.log('[Analytics] Stopping communication strain monitoring', { workspaceId });
      clearTimeout(initialTimeout);
      clearInterval(analyticsInterval);
    };
  }, [workspaceId, user]); // FIXED: Removed setAnalyticsState - setState functions are stable

  const getStrainColor = (strainLevel: 'calm' | 'mild' | 'tense' | 'critical'): string => {
    switch (strainLevel) {
      case 'critical': return '#FF4444';
      case 'tense': return '#FF8800';
      case 'mild': return '#FFAA00';
      default: return '#44AA44';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading communication state...</Text>
      </View>
    );
  }

  const modeInfo = currentMode ? getModeDisplay(currentMode.current_mode) : null;
  const isEmergencyBreak = currentMode?.current_mode === 'emergency_break';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Communication Circuit Breaker</Text>
        <Text style={styles.subtitle}>Anti-Debugging System</Text>
      </View>

      {/* Current Mode Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Mode</Text>
        {modeInfo ? (
          <>
            <Text style={[styles.statusValue, { color: modeInfo.color }]}>
              {modeInfo.text}
            </Text>
            <Text style={styles.statusDescription}>{modeInfo.description}</Text>
            {currentMode && currentMode.break_count_today > 0 && (
              <Text style={styles.breakCount}>
                Breaks today: {currentMode.break_count_today}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.statusValue}>Not initialized</Text>
        )}
      </View>

      {/* Emergency Break Section */}
      {!isEmergencyBreak ? (
        <View style={styles.emergencySection}>
          <Text style={styles.emergencyTitle}>Need a Communication Break?</Text>
          <Text style={styles.emergencyDescription}>
            Use this when communication becomes counterproductive or you need time to reset.
          </Text>
          <EmergencyBreakButton onEmergencyBreak={handleEmergencyBreak} />
        </View>
      ) : (
        <View style={styles.breakActiveSection}>
          <Text style={styles.breakActiveTitle}>🔴 Emergency Break Active</Text>
          <Text style={styles.breakActiveDescription}>
            Communication is paused. Take time to reset and process.
          </Text>
          
          {!currentMode?.partner_acknowledged && (
            <View style={styles.acknowledgeSection}>
              <Text style={styles.acknowledgeText}>
                Acknowledge this break to notify your partner
              </Text>
              <TouchableOpacity 
                style={styles.acknowledgeButton}
                onPress={handleAcknowledgeBreak}
              >
                <Text style={styles.acknowledgeButtonText}>Acknowledge Break</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentMode?.partner_acknowledged && (
            <View style={styles.resumeSection}>
              <Text style={styles.resumeText}>
                ✅ Break acknowledged by both partners
              </Text>
              <TouchableOpacity 
                style={styles.resumeButton}
                onPress={handleResumeNormal}
              >
                <Text style={styles.resumeButtonText}>Resume Communication</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Analytics Status Indicator */}
      <View style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>Communication Health Monitor</Text>
          {analyticsState.isActive && (
            <View style={styles.activeIndicator}>
              <Text style={styles.activeText}>●</Text>
            </View>
          )}
        </View>
        
        <View style={styles.analyticsContent}>
          <View style={styles.strainIndicator}>
            <View 
              style={[
                styles.strainDot, 
                { backgroundColor: getStrainColor(analyticsState.strainLevel) }
              ]} 
            />
            <Text style={styles.strainLevel}>
              {analyticsState.strainLevel.charAt(0).toUpperCase() + analyticsState.strainLevel.slice(1)}
            </Text>
            {analyticsState.confidence > 0 && (
              <Text style={styles.confidenceText}>
                ({analyticsState.confidence}% confidence)
              </Text>
            )}
          </View>
          
          {analyticsState.lastAnalysis && (
            <Text style={styles.lastAnalysisText}>
              Last checked: {analyticsState.lastAnalysis.toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>

      {/* Pending Clarifications Section */}
      {!isEmergencyBreak && (
        <View style={styles.clarificationSection}>
          <Text style={styles.sectionTitle}>Pending Clarifications</Text>
          <Text style={styles.sectionDescription}>
            Review and respond to assumption clarifications from your team
          </Text>
          <PendingClarificationList />
        </View>
      )}

      {/* Assumption Clarification Section */}
      {!isEmergencyBreak && (
        <View style={styles.clarificationSection}>
          <Text style={styles.sectionTitle}>Propose New Clarification</Text>
          <Text style={styles.sectionDescription}>
            Create a new assumption clarification for your team to review
          </Text>
          <AssumptionClarification 
            onProposeConversation={handleProposeConversation}
            workspaceId={workspaceId}
          />
        </View>
      )}

      {/* Recent Activity */}
      {recentEvents.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          {recentEvents.map((event, index) => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventType}>{event.event_type.replace('_', ' ')}</Text>
              <Text style={styles.eventTime}>
                {new Date(event.created_at).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  breakCount: {
    fontSize: 12,
    color: '#999',
  },
  emergencySection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  breakActiveSection: {
    backgroundColor: '#ffebee',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f44336',
  },
  breakActiveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  breakActiveDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  acknowledgeSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  acknowledgeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  acknowledgeButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  acknowledgeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resumeSection: {
    alignItems: 'center',
  },
  resumeText: {
    fontSize: 14,
    color: '#4caf50',
    textAlign: 'center',
    marginBottom: 12,
  },
  resumeButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  activitySection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  eventType: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
  },
  clarificationSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  analyticsCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  analyticsContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  strainIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strainDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  strainLevel: {
    fontSize: 14,
    color: '#333',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  lastAnalysisText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default CommunicationDashboard;
