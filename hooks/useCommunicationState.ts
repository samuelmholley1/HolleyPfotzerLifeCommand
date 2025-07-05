// hooks/useCommunicationState.ts
// Optimized hook for managing communication state with proper memoization and error handling

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database, CommunicationMode } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useUserWorkspace } from '../hooks/useUserWorkspace';

export interface CommunicationState {
  currentState: 'calm' | 'tense' | 'paused';
  currentMode: 'normal' | 'careful' | 'emergency_break' | 'mediated';
  activeTopic?: string;
  breakCountToday: number;
  partnerAcknowledged: boolean;
  timeoutEnd?: number;
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface UseCommunicationStateReturn extends CommunicationState {
  retry: () => void;
  isConnected: boolean;
}

const DEFAULT_STATE: CommunicationState = {
  currentState: 'calm',
  currentMode: 'normal',
  breakCountToday: 0,
  partnerAcknowledged: true,
  isLoading: true,
};

/**
 * Hook for managing communication state with optimized performance and error handling
 * Includes proper subscription management, memoization, and retry logic
 */
export const useCommunicationState = (): UseCommunicationStateReturn => {
  const { user } = useAuth();
  const { workspaceId } = useUserWorkspace();
  const [state, setState] = useState<CommunicationState>(DEFAULT_STATE);
  const [isConnected, setIsConnected] = useState(true);
  const subscriptionRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef<number | null>(null);

  // Validate and sanitize data from database
  const validateCommunicationMode = useCallback((mode: CommunicationMode): CommunicationState => {
    const validStates = ['calm', 'tense', 'paused'] as const;
    const validModes = ['normal', 'careful', 'emergency_break', 'mediated'] as const;

    return {
      currentState: validStates.includes(mode.stateDisplay as any) 
        ? (mode.stateDisplay as typeof validStates[number])
        : 'calm',
      currentMode: validModes.includes(mode.currentMode as any)
        ? (mode.currentMode as typeof validModes[number])
        : 'normal',
      activeTopic: mode.activeTopic || undefined,
      breakCountToday: Math.max(0, mode.breakCountToday || 0),
      partnerAcknowledged: Boolean(mode.partnerAcknowledged),
      timeoutEnd: mode.timeoutEnd || undefined,
      isLoading: false,
      lastUpdated: new Date(),
    };
  }, []);

  // Setup subscription with proper error handling and retry logic
  const setupSubscription = useCallback(async () => {
    if (!workspaceId || !user || !isMountedRef.current) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Clear any existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      // Create new subscription with error handling
      subscriptionRef.current = database.collections
        .get<CommunicationMode>('communication_modes')
        .query(Q.where('workspace_id', workspaceId))
        .observe()
        .subscribe(
          (communicationModes) => {
            if (!isMountedRef.current) return;

            setIsConnected(true);
            
            if (communicationModes.length > 0) {
              const validatedState = validateCommunicationMode(communicationModes[0]);
              setState(validatedState);
            } else {
              // No communication mode found, use defaults
              setState({
                ...DEFAULT_STATE,
                isLoading: false,
                lastUpdated: new Date(),
              });
            }
          },
          (error) => {
            if (!isMountedRef.current) return;
            
            console.error('Communication state subscription error:', error);
            setIsConnected(false);
            setState(prev => ({ 
              ...prev, 
              isLoading: false,
              error: error?.message || 'Failed to load communication state',
            }));

            // Auto-retry after 5 seconds
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                setupSubscription();
              }
            }, 5000);
          }
        );
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.error('Failed to setup communication state subscription:', error);
      setIsConnected(false);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to setup subscription',
      }));
    }
  }, [workspaceId, user, validateCommunicationMode]);

  // Manual retry function
  const retry = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    setupSubscription();
  }, [setupSubscription]);

  // Setup subscription when dependencies change
  useEffect(() => {
    setupSubscription();
  }, [setupSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    ...state,
    retry,
    isConnected,
  }), [state, retry, isConnected]);
};
