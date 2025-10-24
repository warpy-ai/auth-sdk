/**
 * Root Layout
 *
 * Wraps the app with AuthProvider for session management
 */

import * as React from 'react';
import { AuthProvider } from '../../../src/hooks/useAuth';

export const metadata = {
  title: 'Auth SDK - Next.js Example',
  description: 'Example Next.js app using auth-sdk with MCP support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <AuthProvider secret={process.env.AUTH_SECRET || ''}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
