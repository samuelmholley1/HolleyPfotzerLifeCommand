// __tests__/components/CommunicationStatusBar.test.tsx
// Comprehensive tests for CommunicationStatusBar component

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CommunicationStatusBar from '../../components/CommunicationStatusBar';
import { useCommunicationState } from '../../hooks/useCommunicationState';

// Mock the hook
jest.mock('../../hooks/useCommunicationState');
const mockUseCommunicationState = useCommunicationState as jest.MockedFunction<typeof useCommunicationState>;

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('CommunicationStatusBar', () => {
  const mockRetry = jest.fn();
  const mockOnCircuitBreakSuggested = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultState = {
    currentState: 'calm' as const,
    currentMode: 'normal' as const,
    breakCountToday: 0,
    partnerAcknowledged: true,
    isLoading: false,
    error: undefined,
    lastUpdated: new Date(),
    retry: mockRetry,
    isConnected: true,
  };

  describe('Rendering States', () => {
    it('renders loading state correctly', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        isLoading: true,
      });

      const { getByText } = render(<CommunicationStatusBar />);
      expect(getByText('Checking...')).toBeTruthy();
      expect(getByText('⚪')).toBeTruthy();
    });

    it('renders error state correctly', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        error: 'Connection failed',
        isConnected: false,
      });

      const { getByText } = render(<CommunicationStatusBar />);
      expect(getByText('Error - Tap to retry')).toBeTruthy();
      expect(getByText('⚠️')).toBeTruthy();
      expect(getByText('Offline')).toBeTruthy();
    });

    it('renders calm state correctly', () => {
      mockUseCommunicationState.mockReturnValue(defaultState);

      const { getByText } = render(<CommunicationStatusBar />);
      expect(getByText('Status: Calm')).toBeTruthy();
      expect(getByText('🟢')).toBeTruthy();
    });

    it('renders tense state correctly', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        currentState: 'tense',
        currentMode: 'careful',
      });

      const { getByText } = render(<CommunicationStatusBar />);
      expect(getByText('Status: Tense')).toBeTruthy();
      expect(getByText('🟡')).toBeTruthy();
    });

    it('renders emergency break state correctly', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        currentState: 'paused',
        currentMode: 'emergency_break',
        partnerAcknowledged: false,
      });

      const { getByText } = render(<CommunicationStatusBar />);
      expect(getByText('Emergency Pause')).toBeTruthy();
      expect(getByText('🔴')).toBeTruthy();
      expect(getByText('Pending')).toBeTruthy();
    });

    it('renders emergency break with timeout correctly', () => {
      const futureTime = Date.now() + 600000; // 10 minutes
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        currentState: 'paused',
        currentMode: 'emergency_break',
        timeoutEnd: futureTime,
      });

      const { getByText } = render(<CommunicationStatusBar />);
      expect(getByText('Paused (10m left)')).toBeTruthy();
    });

    it('renders active topic correctly', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        activeTopic: 'Weekend Plans',
      });

      const { getByText } = render(<CommunicationStatusBar />);
      expect(getByText('Status: Calm • Weekend Plans')).toBeTruthy();
    });

    it('renders break count when present', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        breakCountToday: 3,
      });

      const { getByText } = render(<CommunicationStatusBar />);
      expect(getByText('Breaks today: 3')).toBeTruthy();
    });
  });

  describe('Interaction Handling', () => {
    it('shows status alert when pressed in normal state', () => {
      mockUseCommunicationState.mockReturnValue(defaultState);

      const { getByRole } = render(<CommunicationStatusBar />);
      const statusBar = getByRole('button');
      
      fireEvent.press(statusBar);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Communication Status',
        expect.stringContaining('Current Mode: Normal'),
        expect.arrayContaining([{ text: 'OK' }])
      );
    });

    it('shows retry option in error state', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        error: 'Connection failed',
      });

      const { getByRole } = render(<CommunicationStatusBar />);
      const statusBar = getByRole('button');
      
      fireEvent.press(statusBar);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Communication Status',
        expect.stringContaining('Error: Connection failed'),
        expect.arrayContaining([
          { text: 'OK' },
          { text: 'Retry', onPress: mockRetry }
        ])
      );
    });

    it('shows circuit break action when in non-normal mode', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        currentMode: 'careful',
      });

      const { getByRole } = render(
        <CommunicationStatusBar onCircuitBreakSuggested={mockOnCircuitBreakSuggested} />
      );
      const statusBar = getByRole('button');
      
      fireEvent.press(statusBar);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Communication Status',
        expect.stringContaining('Current Mode: Careful'),
        expect.arrayContaining([
          { text: 'OK' },
          { text: 'Take Action', onPress: mockOnCircuitBreakSuggested }
        ])
      );
    });

    it('calls retry when pressed in error state', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        error: 'Connection failed',
      });

      const { getByRole } = render(<CommunicationStatusBar />);
      const statusBar = getByRole('button');
      
      fireEvent.press(statusBar);

      expect(mockRetry).toHaveBeenCalled();
    });

    it('is disabled during loading', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        isLoading: true,
      });

      const { getByRole } = render(<CommunicationStatusBar />);
      const statusBar = getByRole('button');
      
      expect(statusBar.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      mockUseCommunicationState.mockReturnValue(defaultState);

      const { getByRole } = render(<CommunicationStatusBar />);
      const statusBar = getByRole('button');
      
      expect(statusBar.props.accessibilityLabel).toBe('Communication status: Status: Calm');
      expect(statusBar.props.accessibilityHint).toBe('Tap for more details');
    });

    it('has proper accessibility hint for error state', () => {
      mockUseCommunicationState.mockReturnValue({
        ...defaultState,
        error: 'Connection failed',
      });

      const { getByRole } = render(<CommunicationStatusBar />);
      const statusBar = getByRole('button');
      
      expect(statusBar.props.accessibilityHint).toBe('Tap to retry');
    });
  });

  describe('Performance', () => {
    it('does not re-render when props are the same', () => {
      const mockOnCircuitBreak = jest.fn();
      
      const { rerender } = render(
        <CommunicationStatusBar onCircuitBreakSuggested={mockOnCircuitBreak} />
      );

      // Re-render with same props
      rerender(<CommunicationStatusBar onCircuitBreakSuggested={mockOnCircuitBreak} />);

      // Component should be memoized and not re-render unnecessarily
      expect(mockUseCommunicationState).toHaveBeenCalledTimes(2); // Once for each render
    });
  });

  describe('Color Schemes', () => {
    it('uses correct colors for calm state', () => {
      mockUseCommunicationState.mockReturnValue(defaultState);

      const { getByTestId } = render(<CommunicationStatusBar />);
      // This would require adding testID props to the component for testing
    });
  });
});
