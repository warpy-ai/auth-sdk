/**
 * Login Page with Next.js 16 Server Actions
 *
 * New in Next.js 16:
 * - Enhanced Server Actions with updateTag()
 * - Better form handling
 * - Improved error states
 */

import { signInWithEmail } from '../api/auth/actions';

export default function LoginPageV16() {
  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Sign In (Next.js 16)</h1>

      {/* Google OAuth Sign In */}
      <div style={{ marginBottom: '30px' }}>
        <a
          href="/api/auth/signin/google"
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: '#4285f4',
            border: 'none',
            borderRadius: '4px',
            textDecoration: 'none',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          Continue with Google
        </a>
      </div>

      <div style={{
        textAlign: 'center',
        margin: '20px 0',
        color: '#666'
      }}>
        OR
      </div>

      {/* Email Magic Link with Server Action */}
      <form action={signInWithEmail}>
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
            name="email"
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
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Send Magic Link
        </button>
      </form>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f0f9ff',
        borderRadius: '4px',
        fontSize: '14px',
        border: '1px solid #bfdbfe'
      }}>
        <strong>🚀 Next.js 16 Features:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Server Actions with enhanced cache control</li>
          <li>Turbopack for faster dev builds</li>
          <li>React 19.2 with latest features</li>
          <li>Optimized session caching</li>
        </ul>
      </div>

      <div style={{
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>Demo Instructions:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Click "Continue with Google" for OAuth login</li>
          <li>Or use Server Action form for magic link</li>
          <li>Both methods use Next.js 16 optimizations</li>
        </ul>
      </div>
    </div>
  );
}
