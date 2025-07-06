// HolleyPfotzerLifeCommand/components/DailyBriefing.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useDailyStatus } from '../hooks/useDailyStatus';
import { useUserWorkspace } from '../hooks/useUserWorkspace';
import { useAuth } from '../contexts/AuthContext';
import { getTodayDateString } from '../lib/dateUtils';
import { DailyStatus, EnergyLevel } from '../types/dailyStatus';
import { CircuitBreakerPanel } from './CircuitBreakerPanel';
import { AssumptionClarificationModal } from './AssumptionClarificationModal';

const ENERGY_LEVELS: EnergyLevel[] = ['low', 'medium', 'high'];

type CommunicationMode = 'normal' | 'careful' | 'emergency_break' | 'mediated';

const DailyBriefing: React.FC = () => {
  const { user } = useAuth();
  const { workspaceId } = useUserWorkspace();
  const { members, loading, error, upsertDailyStatus } = useDailyStatus(workspaceId);

  const currentUserStatus = members.find(m => m.user_id === user?.id)?.status;

  // Form state
  const [mainFocus, setMainFocus] = useState(currentUserStatus?.main_focus || '');
  const [headsUp, setHeadsUp] = useState(currentUserStatus?.heads_up || '');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(currentUserStatus?.energy_level || 'medium');

  // Communication circuit breaker state
  const [communicationMode, setCommunicationMode] = useState<CommunicationMode>('normal');
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [lastBreakTimestamp, setLastBreakTimestamp] = useState<Date | null>(null);
  const [timeoutEnd, setTimeoutEnd] = useState<Date | null>(null);

  // Capacity tracking for debugging circuit prevention
  const [cognitiveCapacity, setCognitiveCapacity] = useState<'high' | 'medium' | 'low' | 'overloaded'>('medium');
  const [communicationPreference, setCommunicationPreference] = useState<'direct' | 'gentle' | 'minimal'>('direct');

  useEffect(() => {
    if (currentUserStatus) {
      setMainFocus(currentUserStatus.main_focus || '');
      setHeadsUp(currentUserStatus.heads_up || '');
      setEnergyLevel(currentUserStatus.energy_level || 'medium');
    }
  }, [currentUserStatus]);

  const isDarkMode = useColorScheme() === 'dark';

  const themeStyles = {
    backgroundColor: isDarkMode ? '#000' : '#f0f2f5',
    textColor: isDarkMode ? '#fff' : '#000',
    cardBackground: isDarkMode ? '#1a1a1a' : '#fff',
    borderColor: isDarkMode ? '#333' : '#ddd',
    placeholderColor: isDarkMode ? '#888' : '#999',
    buttonBackground: isDarkMode ? '#2c2c2e' : '#e0e0e0',
  };

  const handleEmergencyReset = () => {
    setCommunicationMode('emergency_break');
    setLastBreakTimestamp(new Date());
    Alert.alert(
      'Emergency Break Activated',
      'Current conversation paused. Both partners reset to neutral. Take a moment to breathe.',
      [{ text: 'Acknowledged', onPress: () => setCommunicationMode('normal') }]
    );
  };

  const handleTimeOut = (minutes: number) => {
    const endTime = new Date(Date.now() + minutes * 60 * 1000);
    setTimeoutEnd(endTime);
    setCommunicationMode('emergency_break');
    Alert.alert(
      `${minutes} Minute Break`,
      `Communication timeout until ${endTime.toLocaleTimeString()}. Use this time for self-care.`,
      [{ text: 'Understood' }]
    );
  };

  const handleMediatedDiscussion = () => {
    setCommunicationMode('mediated');
    setShowClarificationModal(true);
  };

  const handleClarificationSubmit = (clarification: any) => {
    // Here you would send this to the partner and/or save it
    console.log('Clarification submitted:', clarification);
    Alert.alert(
      'Clarification Sent',
      'Your explicit communication has been shared. This breaks the assumption loop.',
      [{ text: 'Continue', onPress: () => {
        setShowClarificationModal(false);
        setCommunicationMode('careful');
      }}]
    );
  };

  const handleSubmit = () => {
    if (user && workspaceId) {
      const status: Omit<DailyStatus, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        workspace_id: workspaceId,
        date: getTodayDateString(),
        energy_level: energyLevel,
        main_focus: mainFocus,
        heads_up: headsUp,
      };
      console.log('Saving daily status:', status);
      upsertDailyStatus(status);
    } else {
      console.log('Cannot save - missing user or workspaceId:', { user: !!user, workspaceId });
    }
  };

  // Check if we're in timeout mode
  const isInTimeout = timeoutEnd && new Date() < timeoutEnd;
  const timeRemaining = isInTimeout ? Math.ceil((timeoutEnd!.getTime() - Date.now()) / 60000) : 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeStyles.backgroundColor }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
        <Text style={{ color: themeStyles.textColor, marginTop: 10 }}>Loading Briefings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeStyles.backgroundColor }]}>
        <Text style={{ color: 'red', marginBottom: 10 }}>Error: {error}</Text>
        <Text style={{ color: themeStyles.textColor, textAlign: 'center' }}>
          There was an issue loading the daily briefing. This might be because your workspace is still being set up.
          Please try refreshing the page or signing out and back in.
        </Text>
      </View>
    );
  }

  if (!workspaceId) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeStyles.backgroundColor }]}>
        <Text style={{ color: 'orange', marginBottom: 10 }}>No Workspace Found</Text>
        <Text style={{ color: themeStyles.textColor, textAlign: 'center' }}>
          Your workspace is being set up. Please refresh the page in a moment.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Circuit Breaker Panel - Always available */}
      <CircuitBreakerPanel
        onEmergencyReset={handleEmergencyReset}
        onTimeOut={handleTimeOut}
        onMediatedDiscussion={handleMediatedDiscussion}
      />

      {/* Assumption Clarification Modal */}
      <AssumptionClarificationModal
        visible={showClarificationModal}
        onClose={() => setShowClarificationModal(false)}
        onSubmit={handleClarificationSubmit}
      />

      {/* Timeout Warning */}
      {isInTimeout && (
        <View style={[styles.timeoutBanner, { backgroundColor: '#f39c12' }]}>
          <Text style={styles.timeoutText}>
            🕐 Communication Break Active - {timeRemaining} min remaining
          </Text>
        </View>
      )}

      {/* Communication Mode Indicator */}
      {communicationMode !== 'normal' && (
        <View style={[styles.modeIndicator, { 
          backgroundColor: communicationMode === 'emergency_break' ? '#e74c3c' : '#f39c12' 
        }]}>
          <Text style={styles.modeText}>
            {communicationMode === 'emergency_break' ? '🚨 Emergency Break Mode' :
             communicationMode === 'mediated' ? '🤝 Mediated Discussion Mode' :
             communicationMode === 'careful' ? '⚠️ Careful Communication Mode' : ''}
          </Text>
        </View>
      )}

      <ScrollView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      <Text style={[styles.title, { color: themeStyles.textColor }]}>Today&apos;s Briefing</Text>
      
      <View style={styles.formContainer}>
        <Text style={[styles.formTitle, { color: themeStyles.textColor }]}>
          Your Daily Briefing
        </Text>

        <Text style={[styles.label, { color: themeStyles.textColor }]}>Energy Level</Text>
        <View style={styles.energySelector}>
          {ENERGY_LEVELS.map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.energyButton,
                {
                  backgroundColor: energyLevel === level ? '#4285F4' : themeStyles.buttonBackground,
                  borderColor: themeStyles.borderColor,
                },
              ]}
              onPress={() => setEnergyLevel(level)}
            >
              <Text style={[styles.energyButtonText, { color: energyLevel === level ? '#fff' : themeStyles.textColor }]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={[styles.label, { color: themeStyles.textColor }]}>Main Focus Today</Text>
        <TextInput
          style={[styles.input, { color: themeStyles.textColor, borderColor: themeStyles.borderColor }]}
          value={mainFocus}
          onChangeText={setMainFocus}
          placeholder="e.g., Deep work on Reclaim project"
          placeholderTextColor={themeStyles.placeholderColor}
        />

        <Text style={[styles.label, { color: themeStyles.textColor }]}>A Quick Heads-Up</Text>
        <TextInput
          style={[styles.input, { color: themeStyles.textColor, borderColor: themeStyles.borderColor }]}
          value={headsUp}
          onChangeText={setHeadsUp}
          placeholder="e.g., Woke up with a migraine"
          placeholderTextColor={themeStyles.placeholderColor}
          multiline
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {members.length > 0 ? (
        members.map(member => (
          <View key={member.user_id} style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: member.avatar_url || 'https://placekitten.com/50/50' }}
                style={styles.avatar}
                alt={`${member.full_name} avatar`}
              />
              <Text style={[styles.cardTitle, { color: themeStyles.textColor }]}>
                {member.full_name}
              </Text>
            </View>
            {member.status ? (
              <View style={styles.cardBody}>
                <Text style={[styles.statusText, { color: themeStyles.textColor }]}>
                  <Text style={styles.bold}>Energy:</Text> {member.status.energy_level}
                </Text>
                <Text style={[styles.statusText, { color: themeStyles.textColor }]}>
                  <Text style={styles.bold}>Focus:</Text> {member.status.main_focus}
                </Text>
                <Text style={[styles.statusText, { color: themeStyles.textColor }]}>
                  <Text style={styles.bold}>Heads Up:</Text> {member.status.heads_up}
                </Text>
              </View>
            ) : (
              <View style={styles.cardBody}>
                <Text style={[styles.waitingText, { color: themeStyles.placeholderColor }]}>
                  Waiting for briefing...
                </Text>
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={[styles.centeredText, { color: themeStyles.textColor }]}>
          No members found in this workspace.
        </Text>
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardBody: {
    // No specific styles needed here now
  },
  statusText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  waitingText: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'transparent', // Adjusted for a cleaner look
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  centeredText: {
    textAlign: 'center',
    marginTop: 20,
  },
  energySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  energyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  energyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeoutBanner: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  timeoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modeIndicator: {
    padding: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  modeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DailyBriefing;
