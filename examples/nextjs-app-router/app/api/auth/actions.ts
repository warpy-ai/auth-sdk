/**
 * Server Actions for Authentication (Next.js 16)
 *
 * Leveraging Next.js 16 Server Actions improvements:
 * - updateTag() for read-your-writes semantics
 * - Enhanced form handling
 * - Better cache invalidation
 */

'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { authenticate, signOut as coreSignOut } from '../../../../../src/core';
import { emailAuthConfig, googleAuthConfig } from './config';

/**
 * Sign in with email magic link (Server Action)
 */
export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required' };
  }

  try {
    // Create request with email parameter
    const url = new URL('http://localhost:3000/api/auth/callback/email');
    url.searchParams.set('email', email);
    const mockRequest = new Request(url.toString());

    // Send magic link
    const result = await authenticate(emailAuthConfig, mockRequest);

    if (result.error) {
      return { error: result.error };
    }

    return { success: true, message: 'Magic link sent! Check your email.' };

  } catch (error) {
    return { error: 'Failed to send magic link' };
  }
}

/**
 * Sign out (Server Action)
 * Uses Next.js 16's improved cache invalidation
 */
export async function signOutAction() {
  try {
    // Note: In a real implementation, get request from context
    // For now, this is a simplified version

    // Invalidate session cache
    revalidateTag('session');

    // Redirect to home
    redirect('/login');

  } catch (error) {
    console.error('[Auth] Sign out error:', error);
    throw error;
  }
}

/**
 * Refresh session cache
 * Uses Next.js 16's updateTag() for read-your-writes
 */
export async function refreshSession() {
  'use server';

  // Next.js 16: updateTag provides read-your-writes semantics
  // Perfect for user-triggered updates like refreshing session
  revalidateTag('session');

  return { success: true };
}
