import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { MockAuthProvider } from '../contexts/MockAuthContext';
import './globals.css';

const E2E = process.env.NEXT_PUBLIC_PW_E2E === '1';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const Provider = E2E ? MockAuthProvider : AuthProvider;
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
