"use client";

import React, { createContext, useContext, ReactNode } from 'react';

const MockAuthContext = createContext({
  user: {},
  activeWorkspaceId: '',
  loading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (process.env.NEXT_PUBLIC_PW_E2E === '1') {
    const MOCK_USER = { id: 'e2e-user', name: 'E2E User' };
    const MOCK_WS = 'e2e-ws';
    return (
      <MockAuthContext.Provider
        value={{
          user: MOCK_USER,
          activeWorkspaceId: MOCK_WS,
          loading: false,
          signInWithGoogle: async () => {},
          signOut: async () => {},
        }}
      >
        {children}
      </MockAuthContext.Provider>
    );
  }
  // fallback for non-E2E
  return (
    <MockAuthContext.Provider value={{ user: {}, activeWorkspaceId: '', loading: false, signInWithGoogle: async () => {}, signOut: async () => {} }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => useContext(MockAuthContext);
