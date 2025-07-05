// components/CommunicationStatusBar.tsx
// Optimized real-time communication status bar with proper memoization and error handling

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCommunicationState } from '../hooks/useCommunicationState';

interface CommunicationStatusBarProps {
  onCircuitBreakSuggested?: () => void;
}

const BACKGROUND_COLORS = {
  calm: '#4CAF50',    // Green
  tense: '#FFC107',   // Yellow
  paused: '#F44336',  // Red
} as const;

const TEXT_COLORS = {
  calm: '#FFFFFF',
  tense: '#000000',
  paused: '#FFFFFF',
} as const;

const MODE_DISPLAY = {
  normal: { text: 'Normal', emoji: '🟢', description: 'Communication flowing normally' },
  careful: { text: 'Careful', emoji: '🟡', description: 'Extra attention to communication patterns' },
  emergency_break: { text: 'Paused', emoji: '🔴', description: 'Communication is paused for reset' },
  mediated: { text: 'Mediated', emoji: '🟣', description: 'Structured communication with guidelines' },
} as const;

const CommunicationStatusBar: React.FC<CommunicationStatusBarProps> = React.memo(({
  onCircuitBreakSuggested,
}) => {
  const state = useCommunicationState();
  const isDarkMode = useColorScheme() === 'dark';

  
  // Memoized event handlers to prevent unnecessary re-renders
  const handleStatusPress = useCallback(() => {
    const modeInfo = MODE_DISPLAY[state.currentMode];
    
    Alert.alert(
      'Communication Status',
      `Current Mode: ${modeInfo.text}\n\n${modeInfo.description}\n\n${
        state.breakCountToday > 0 
          ? `Emergency breaks today: ${state.breakCountToday}\n\n` 
          : ''
      }${state.lastUpdated ? `Last updated: ${state.lastUpdated.toLocaleTimeString()}` : ''}${
        state.error ? `\n\nError: ${state.error}` : ''
      }${!state.isConnected ? '\n\n⚠️ Connection issues detected' : ''}`,
      [
        { text: 'OK' },
        ...(state.error ? [{ text: 'Retry', onPress: state.retry }] : []),
        ...(state.currentMode !== 'normal' && onCircuitBreakSuggested ? [
          { text: 'Take Action', onPress: onCircuitBreakSuggested }
        ] : []),
      ]
    );
  }, [state, onCircuitBreakSuggested]);

  // Memoized display text to prevent recalculation
  const displayText = useMemo(() => {
    if (state.isLoading) return 'Checking...';
    if (state.error) return 'Error - Tap to retry';
    
    if (state.currentMode === 'emergency_break') {
      if (state.timeoutEnd) {
        const timeLeft = state.timeoutEnd - Date.now();
        if (timeLeft > 0) {
          const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
          return `Paused (${minutesLeft}m left)`;
        }
      }
      return 'Emergency Pause';
    }
    
    // Include active topic if available
    const baseText = `Status: ${state.currentState.charAt(0).toUpperCase() + state.currentState.slice(1)}`;
    if (state.activeTopic) {
      return `${baseText} • ${state.activeTopic}`;
    }
    return baseText;
  }, [state.isLoading, state.error, state.currentMode, state.timeoutEnd, state.currentState, state.activeTopic]);

  // Memoized emoji to prevent recalculation
  const emoji = useMemo(() => {
    if (state.isLoading) return '⚪';
    if (state.error) return '⚠️';
    if (!state.isConnected) return '🔄';
    return MODE_DISPLAY[state.currentMode].emoji;
  }, [state.isLoading, state.error, state.isConnected, state.currentMode]);

  // Memoized colors
  const backgroundColor = useMemo(() => {
    if (state.error) return '#FF5722'; // Error red
    return BACKGROUND_COLORS[state.currentState];
  }, [state.error, state.currentState]);

  const textColor = useMemo(() => {
    if (state.error) return '#FFFFFF';
    return TEXT_COLORS[state.currentState];
  }, [state.error, state.currentState]);

  // Always render the status bar for authenticated users
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity 
        style={styles.touchable}
        onPress={state.error ? state.retry : handleStatusPress}
        disabled={state.isLoading}
        accessibilityRole="button"
        accessibilityLabel={`Communication status: ${displayText}`}
        accessibilityHint={state.error ? "Tap to retry" : "Tap for more details"}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={[styles.statusText, { color: textColor }]} numberOfLines={1}>
            {displayText}
          </Text>
          {state.currentMode === 'emergency_break' && !state.partnerAcknowledged && (
            <Text style={styles.pendingText}>Pending</Text>
          )}
          {!state.isConnected && (
            <Text style={styles.offlineText}>Offline</Text>
          )}
        </View>
        
        {state.breakCountToday > 0 && (
          <Text style={[styles.breakCountText, { color: textColor }]}>
            Breaks today: {state.breakCountToday}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});

// Set display name for debugging
CommunicationStatusBar.displayName = 'CommunicationStatusBar';
const styles = StyleSheet.create({
  container: {
    height: 32,
    width: '100%',
    justifyContent: 'center',
    // Use relative positioning instead of absolute to be part of the layout flow
    zIndex: 100, // Reduced z-index to avoid conflicts
    // Add a subtle shadow for better visibility
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  touchable: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  pendingText: {
    fontSize: 10,
    color: '#ff9800',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  offlineText: {
    fontSize: 10,
    color: '#ff5722',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  breakCountText: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
});

export default CommunicationStatusBar;
