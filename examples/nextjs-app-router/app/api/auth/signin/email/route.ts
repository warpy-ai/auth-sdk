/**
 * Email Magic Link Sign In Route
 *
 * POST /api/auth/signin/email
 * Sends a magic link to the provided email address
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '../../../../../../../src/core';
import { emailAuthConfig } from '../../config';
import { z } from 'zod';

const EmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  callbackUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = EmailSchema.parse(body);

    // Create request URL with email parameter
    const callbackUrl = validatedData.callbackUrl || `${request.nextUrl.origin}/api/auth/callback/email`;
    const requestUrl = new URL(callbackUrl);
    requestUrl.searchParams.set('email', validatedData.email);

    const mockRequest = new Request(requestUrl.toString());

    // Send magic link
    const result = await authenticate(emailAuthConfig, mockRequest);

    if (result.error) {
      console.error('[Auth] Email sign in error:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Email sent successfully
    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email.',
      email: validatedData.email,
    });

  } catch (error) {
    console.error('[Auth] Email sign in exception:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}
