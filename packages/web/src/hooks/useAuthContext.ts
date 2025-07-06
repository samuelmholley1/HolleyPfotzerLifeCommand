"use client";
import { useAuth as useRealAuth } from '../contexts/AuthContext';
import { useMockAuth } from '../contexts/MockAuthContext';

const isE2E = process.env.NEXT_PUBLIC_PW_E2E === '1' || process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

export const useAuthContext = () => {
  if (isE2E) {
    // In E2E tests, we use the mock auth context.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMockAuth();
  }
  // In all other environments, we use the real auth context.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useRealAuth();
};
