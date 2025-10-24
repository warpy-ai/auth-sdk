/**
 * Home Page
 *
 * Demonstrates session management with auth-sdk
 */

'use client';

import * as React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';

export default function HomePage() {
  const { session, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', padding: '20px' }}>
        <h1>Welcome to Auth SDK Demo</h1>
        <p>You are not signed in.</p>
        <a
          href="/login"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '100px auto', padding: '20px' }}>
      <h1>Welcome back!</h1>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h2>Your Session</h2>
        <div style={{ marginTop: '15px' }}>
          <p><strong>User ID:</strong> {session.user.id}</p>
          <p><strong>Email:</strong> {session.user.email}</p>
          {session.user.name && (
            <p><strong>Name:</strong> {session.user.name}</p>
          )}
          <p><strong>Session Type:</strong> {session.type || 'standard'}</p>
          <p><strong>Expires:</strong> {new Date(session.expires).toLocaleString()}</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        style={{
          marginTop: '30px',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Sign Out
      </button>

      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#e8f4f8',
        borderRadius: '8px'
      }}>
        <h3>Available API Endpoints</h3>
        <ul style={{ marginTop: '15px' }}>
          <li><code>GET /api/auth/session</code> - Get current session</li>
          <li><code>GET /api/auth/signin/google</code> - Sign in with Google</li>
          <li><code>POST /api/auth/signin/email</code> - Send magic link</li>
          <li><code>POST /api/auth/signout</code> - Sign out</li>
          <li><code>POST /api/mcp</code> - MCP tools (AI agents)</li>
        </ul>
      </div>
    </div>
  );
}
