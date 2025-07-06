import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { MockAuthProvider } from '../contexts/MockAuthContext';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {process.env.NEXT_PUBLIC_PW_E2E === '1' ? (
          <MockAuthProvider>{children}</MockAuthProvider>
        ) : (
          <AuthProvider>{children}</AuthProvider>
        )}
      </body>
    </html>
  );
}
