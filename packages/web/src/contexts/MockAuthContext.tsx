"use client";

import React, { createContext, useContext, ReactNode } from 'react';

const MOCK_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'mock-e2e-user@example.com',
  name: 'Mock E2E User',
  active_workspace_id: '00000000-0000-4000-8000-000000000002',
};

const MockAuthContext = createContext({
  user: MOCK_USER,
  loading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MockAuthProvider must never run in production!');
  }
  if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== 'true') {
    throw new Error('MockAuthProvider requires NEXT_PUBLIC_USE_MOCK_AUTH=true');
  }
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PW_E2E === '1') {
    return <div data-testid="stub-authenticated">E2E User</div>;
  }
  return (
    <MockAuthContext.Provider value={{
      user: MOCK_USER,
      loading: false,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => useContext(MockAuthContext);
