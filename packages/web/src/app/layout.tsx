import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { MockAuthProvider } from '../contexts/MockAuthContext';
import './globals.css';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' && process.env.NODE_ENV !== 'production';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {useMock ? (
          <MockAuthProvider>{children}</MockAuthProvider>
        ) : (
          <AuthProvider>{children}</AuthProvider>
        )}
      </body>
    </html>
  );
}
