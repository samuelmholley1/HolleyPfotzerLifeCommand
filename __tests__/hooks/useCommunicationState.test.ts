// __tests__/hooks/useCommunicationState.test.ts
// Comprehensive tests for useCommunicationState hook

import { renderHook, act } from '@testing-library/react-hooks';
import { useCommunicationState } from '../../hooks/useCommunicationState';
import { useAuth } from '../../contexts/AuthContext';
import { useUserWorkspace } from '../../hooks/useUserWorkspace';
import { database } from '../../lib/db';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useUserWorkspace');
jest.mock('../../lib/db');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseUserWorkspace = useUserWorkspace as jest.MockedFunction<typeof useUserWorkspace>;

describe('useCommunicationState', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockWorkspaceId = 'workspace-456';
  const mockSubscription = {
    unsubscribe: jest.fn(),
  };
  const mockQuery = {
    observe: jest.fn(),
  };
  const mockCollection = {
    query: jest.fn(() => mockQuery),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    });

    mockUseUserWorkspace.mockReturnValue({
      workspaceId: mockWorkspaceId,
      loading: false,
      error: null,
    });

    (database.collections.get as jest.Mock).mockReturnValue(mockCollection);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('returns loading state initially', () => {
      mockQuery.observe.mockReturnValue({
        subscribe: jest.fn(),
      });

      const { result } = renderHook(() => useCommunicationState());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.currentState).toBe('calm');
      expect(result.current.currentMode).toBe('normal');
    });

    it('returns not loading when no user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      mockQuery.observe.mockReturnValue({
        subscribe: jest.fn(),
      });

      const { result } = renderHook(() => useCommunicationState());

      expect(result.current.isLoading).toBe(false);
    });

    it('returns not loading when no workspace', () => {
      mockUseUserWorkspace.mockReturnValue({
        workspaceId: null,
        loading: false,
        error: null,
      });

      mockQuery.observe.mockReturnValue({
        subscribe: jest.fn(),
      });

      const { result } = renderHook(() => useCommunicationState());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Subscription Management', () => {
    it('sets up subscription correctly', () => {
      const mockSubscribe = jest.fn(() => mockSubscription);
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      renderHook(() => useCommunicationState());

      expect(database.collections.get).toHaveBeenCalledWith('communication_modes');
      expect(mockCollection.query).toHaveBeenCalled();
      expect(mockQuery.observe).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('unsubscribes on unmount', () => {
      const mockSubscribe = jest.fn(() => mockSubscription);
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { unmount } = renderHook(() => useCommunicationState());

      unmount();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('cleans up timeout on unmount', () => {
      const mockSubscribe = jest.fn((onNext, onError) => {
        // Simulate error to trigger timeout
        onError(new Error('Connection failed'));
        return mockSubscription;
      });
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { unmount } = renderHook(() => useCommunicationState());

      unmount();

      // Fast-forward timer to ensure cleanup
      act(() => {
        jest.runAllTimers();
      });

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Data Validation', () => {
    it('validates and sanitizes communication mode data', () => {
      const mockCommunicationMode = {
        stateDisplay: 'calm',
        currentMode: 'normal',
        activeTopic: 'Test Topic',
        breakCountToday: 2,
        partnerAcknowledged: true,
        timeoutEnd: Date.now() + 300000,
      };

      const mockSubscribe = jest.fn((onNext) => {
        onNext([mockCommunicationMode]);
        return mockSubscription;
      });
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { result } = renderHook(() => useCommunicationState());

      expect(result.current.currentState).toBe('calm');
      expect(result.current.currentMode).toBe('normal');
      expect(result.current.activeTopic).toBe('Test Topic');
      expect(result.current.breakCountToday).toBe(2);
      expect(result.current.partnerAcknowledged).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles invalid state values gracefully', () => {
      const mockCommunicationMode = {
        stateDisplay: 'invalid-state',
        currentMode: 'invalid-mode',
        breakCountToday: -5, // Invalid negative value
        partnerAcknowledged: null, // Invalid null value
      };

      const mockSubscribe = jest.fn((onNext) => {
        onNext([mockCommunicationMode]);
        return mockSubscription;
      });
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { result } = renderHook(() => useCommunicationState());

      expect(result.current.currentState).toBe('calm'); // Default fallback
      expect(result.current.currentMode).toBe('normal'); // Default fallback
      expect(result.current.breakCountToday).toBe(0); // Sanitized to 0
      expect(result.current.partnerAcknowledged).toBe(false); // Boolean conversion
    });

    it('handles empty communication modes array', () => {
      const mockSubscribe = jest.fn((onNext) => {
        onNext([]); // Empty array
        return mockSubscription;
      });
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { result } = renderHook(() => useCommunicationState());

      expect(result.current.currentState).toBe('calm');
      expect(result.current.currentMode).toBe('normal');
      expect(result.current.breakCountToday).toBe(0);
      expect(result.current.partnerAcknowledged).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles subscription errors', () => {
      const mockError = new Error('Database connection failed');
      const mockSubscribe = jest.fn((onNext, onError) => {
        onError(mockError);
        return mockSubscription;
      });
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { result } = renderHook(() => useCommunicationState());

      expect(result.current.error).toBe('Database connection failed');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isConnected).toBe(false);
    });

    it('retries automatically after error', () => {
      const mockError = new Error('Temporary failure');
      let callCount = 0;
      const mockSubscribe = jest.fn((onNext, onError) => {
        callCount++;
        if (callCount === 1) {
          onError(mockError);
        } else {
          onNext([]);
        }
        return mockSubscription;
      });
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      renderHook(() => useCommunicationState());

      // Fast-forward to trigger retry
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockSubscribe).toHaveBeenCalledTimes(2);
    });

    it('provides manual retry function', () => {
      const mockError = new Error('Manual retry test');
      const mockSubscribe = jest.fn((onNext, onError) => {
        onError(mockError);
        return mockSubscription;
      });
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { result } = renderHook(() => useCommunicationState());

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.retry();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Performance Optimization', () => {
    it('memoizes return value to prevent unnecessary re-renders', () => {
      const mockSubscribe = jest.fn((onNext) => {
        onNext([]);
        return mockSubscription;
      });
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { result, rerender } = renderHook(() => useCommunicationState());
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      // The hook should return the same object reference if state hasn't changed
      expect(firstResult).toBe(secondResult);
    });

    it('only re-subscribes when dependencies change', () => {
      const mockSubscribe = jest.fn(() => mockSubscription);
      mockQuery.observe.mockReturnValue({
        subscribe: mockSubscribe,
      });

      const { rerender } = renderHook(() => useCommunicationState());

      // Initial subscription
      expect(mockSubscribe).toHaveBeenCalledTimes(1);

      // Re-render without changing dependencies
      rerender();
      expect(mockSubscribe).toHaveBeenCalledTimes(1);

      // Change workspace ID
      mockUseUserWorkspace.mockReturnValue({
        workspaceId: 'new-workspace',
        loading: false,
        error: null,
      });

      rerender();
      expect(mockSubscribe).toHaveBeenCalledTimes(2);
    });
  });
});
