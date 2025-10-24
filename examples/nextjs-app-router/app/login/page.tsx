/**
 * Login Page
 *
 * Demonstrates how to use the auth-sdk with Google OAuth and Email magic links
 */

'use client';

import * as React from 'react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
      } else {
        setError(data.error || 'Failed to send magic link');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/signin/google';
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Sign In</h1>

      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00'
        }}>
          {error}
        </div>
      )}

      {emailSent ? (
        <div style={{
          padding: '20px',
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <h2>Check your email!</h2>
          <p>We sent a magic link to {email}</p>
          <button
            onClick={() => setEmailSent(false)}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Send another link
          </button>
        </div>
      ) : (
        <>
          {/* Google OAuth Sign In */}
          <div style={{ marginBottom: '30px' }}>
            <button
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: '#4285f4',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Continue with Google
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            margin: '20px 0',
            color: '#666'
          }}>
            OR
          </div>

          {/* Email Magic Link Sign In */}
          <form onSubmit={handleEmailSignIn}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: loading ? '#ccc' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        </>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>Demo Instructions:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Click "Continue with Google" for OAuth login</li>
          <li>Or enter your email for a passwordless magic link</li>
          <li>Both methods create a secure session</li>
        </ul>
      </div>
    </div>
  );
}
