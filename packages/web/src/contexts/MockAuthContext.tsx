"use client";

import React, { createContext, useContext, ReactNode } from 'react';

const MOCK_USER = { id: 'e2e-user', name: 'E2E User', active_workspace_id: 'e2e-ws' };
const MOCK_WORKSPACE = { id: 'e2e-ws', name: 'Default Workspace', ownerId: MOCK_USER.id };

const MockAuthContext = createContext({
  user: MOCK_USER,
  activeWorkspaceId: MOCK_WORKSPACE.id,
  workspaces: [MOCK_WORKSPACE],
  loading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (process.env.NEXT_PUBLIC_PW_E2E === '1') {
    return (
      <MockAuthContext.Provider
        value={{
          user: MOCK_USER,
          activeWorkspaceId: MOCK_WORKSPACE.id,
          workspaces: [MOCK_WORKSPACE],
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
    <MockAuthContext.Provider value={{ user: MOCK_USER, activeWorkspaceId: '', workspaces: [], loading: false, signInWithGoogle: async () => {}, signOut: async () => {} }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => useContext(MockAuthContext);
