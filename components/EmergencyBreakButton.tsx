import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Alert } from 'react-native';

interface EmergencyBreakButtonProps {
  onEmergencyBreak: () => Promise<void>;
  isVisible?: boolean;
  disabled?: boolean;
}

export const EmergencyBreakButton: React.FC<EmergencyBreakButtonProps> = ({
  onEmergencyBreak,
  isVisible = true,
  disabled = false
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnimation = useMemo(() => new Animated.Value(1), []);

  const startPulseAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnimation]);

  useEffect(() => {
    if (isVisible && !disabled) {
      startPulseAnimation();
    }
  }, [isVisible, disabled, startPulseAnimation]);

  const handlePress = () => {
    if (disabled || isProcessing) return;
    
    setIsPressed(true);
    setShowConfirmModal(true);
    
    // Haptic feedback on supported platforms
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setShowConfirmModal(false);
    
    try {
      await onEmergencyBreak();
      
      Alert.alert(
        'Emergency Break Activated',
        'Communication has been paused. Take time to reset and reconnect when ready.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to activate emergency break. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setIsPressed(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setIsPressed(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <Animated.View style={[
        styles.container,
        { transform: [{ scale: pulseAnimation }] }
      ]}>
        <TouchableOpacity
          style={[
            styles.button,
            isPressed && styles.buttonPressed,
            disabled && styles.buttonDisabled,
            isProcessing && styles.buttonProcessing
          ]}
          onPress={handlePress}
          disabled={disabled || isProcessing}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.buttonText,
            disabled && styles.buttonTextDisabled
          ]}>
            {isProcessing ? 'ACTIVATING...' : 'EMERGENCY BREAK'}
          </Text>
          <Text style={styles.subtitle}>
            Pause Communication
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Emergency Communication Break</Text>
              
              <Text style={styles.modalDescription}>
                This will immediately pause all communication and activate the circuit breaker.
                {'\n\n'}
                Use this when you need time to reset, process, or when communication is becoming counterproductive.
                {'\n\n'}
                Both partners will be notified of the break.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Activate Break</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
  button: {
    backgroundColor: '#FF4444',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#CC0000',
  },
  buttonPressed: {
    backgroundColor: '#CC0000',
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    borderColor: '#999999',
  },
  buttonProcessing: {
    backgroundColor: '#FF6666',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#666666',
  },
  subtitle: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmergencyBreakButton;
