// Proactive Communication Status - Shows current communication health and risks
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { 
  communicationStateManager, 
  CommunicationMode,
  CommunicationModeType 
} from '../services/communication-state-manager';
import { useAuth } from '../contexts/AuthContext';
import { useUserWorkspace } from '../hooks/useUserWorkspace';

interface CommunicationStatusBarProps {
  onCircuitBreakSuggested: () => void;
  userCapacity?: {
    energy: string;
    cognitiveLoad: number;
  };
}

export const CommunicationStatusBar: React.FC<CommunicationStatusBarProps> = ({
  onCircuitBreakSuggested,
  userCapacity = { energy: 'medium', cognitiveLoad: 5 }
}) => {
  const [currentMode, setCurrentMode] = useState<CommunicationMode | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  
  const { user } = useAuth();
  const { workspaceId } = useUserWorkspace();
  const isDarkMode = useColorScheme() === 'dark';

  const themeStyles = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
    textColor: isDarkMode ? '#fff' : '#000',
    modeColors: {
      normal: '#27ae60',
      careful: '#f39c12', 
      emergency_break: '#e74c3c',
      mediated: '#9b59b6',
    },
  };

  const loadCurrentMode = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const mode = await communicationStateManager.getCurrentMode(workspaceId);
      setCurrentMode(mode);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error loading communication mode:', error);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId && user) {
      loadCurrentMode();
      
      // Subscribe to real-time changes
      const subscription = communicationStateManager.subscribeToModeChanges(
        workspaceId,
        handleModeChange
      );
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [workspaceId, user, loadCurrentMode]);

  const handleModeChange = (mode: CommunicationMode) => {
    setCurrentMode(mode);
    setLastCheck(new Date());
  };

  const getModeDisplay = (mode: CommunicationModeType): { 
    text: string; 
    color: string; 
    emoji: string;
    description: string;
  } => {
    switch (mode) {
      case 'normal':
        return {
          text: 'Normal',
          color: themeStyles.modeColors.normal,
          emoji: '🟢',
          description: 'Communication flowing normally'
        };
      case 'careful':
        return {
          text: 'Careful',
          color: themeStyles.modeColors.careful,
          emoji: '🟡',
          description: 'Extra attention to communication patterns'
        };
      case 'emergency_break':
        return {
          text: 'Paused',
          color: themeStyles.modeColors.emergency_break,
          emoji: '🔴',
          description: 'Communication is paused for reset'
        };
      case 'mediated':
        return {
          text: 'Mediated',
          color: themeStyles.modeColors.mediated,
          emoji: '🟣',
          description: 'Structured communication with guidelines'
        };
      default:
        return {
          text: 'Unknown',
          color: '#757575',
          emoji: '⚪',
          description: 'Status unclear'
        };
    }
  };

  const handleStatusPress = () => {
    if (!currentMode) return;

    const modeInfo = getModeDisplay(currentMode.current_mode);
    
    Alert.alert(
      'Communication Status',
      `Current Mode: ${modeInfo.text}\n\n${modeInfo.description}\n\n${
        currentMode.break_count_today > 0 
          ? `Emergency breaks today: ${currentMode.break_count_today}\n\n` 
          : ''
      }Last updated: ${lastCheck.toLocaleTimeString()}`,
      [
        { text: 'OK' },
        ...(currentMode.current_mode !== 'normal' ? [
          { text: 'Take Action', onPress: onCircuitBreakSuggested }
        ] : []),
      ]
    );
  };

  const getDisplayText = () => {
    if (!currentMode) return 'Checking...';
    
    const modeInfo = getModeDisplay(currentMode.current_mode);
    
    if (currentMode.current_mode === 'emergency_break') {
      if (currentMode.timeout_end) {
        const timeLeft = new Date(currentMode.timeout_end).getTime() - new Date().getTime();
        if (timeLeft > 0) {
          const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
          return `Paused (${minutesLeft}m left)`;
        }
      }
      return 'Emergency Pause';
    }
    
    return `Communication: ${modeInfo.text}`;
  };

  const getEmoji = () => {
    if (!currentMode) return '⚪';
    return getModeDisplay(currentMode.current_mode).emoji;
  };

  const getColor = () => {
    if (!currentMode) return themeStyles.modeColors.normal;
    return getModeDisplay(currentMode.current_mode).color;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: themeStyles.backgroundColor,
          borderLeftColor: getColor(),
        }
      ]}
      onPress={handleStatusPress}
    >
      <View style={styles.content}>
        <View style={styles.statusRow}>
          <Text style={styles.emoji}>{getEmoji()}</Text>
          <Text style={[styles.statusText, { color: themeStyles.textColor }]}>
            {getDisplayText()}
          </Text>
          {currentMode?.current_mode === 'emergency_break' && !currentMode.partner_acknowledged && (
            <Text style={styles.pendingText}>Pending acknowledgment</Text>
          )}
        </View>
        
        {currentMode && currentMode.break_count_today > 0 && (
          <View style={styles.breakCountRow}>
            <Text style={[styles.breakCountText, { color: themeStyles.textColor }]}>
              Emergency breaks today: {currentMode.break_count_today}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  pendingText: {
    fontSize: 11,
    color: '#ff9800',
    fontStyle: 'italic',
  },
  breakCountRow: {
    marginTop: 4,
  },
  breakCountText: {
    fontSize: 11,
    opacity: 0.7,
  },
});

export default CommunicationStatusBar;
