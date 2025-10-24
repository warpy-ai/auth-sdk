import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from 'auth-sdk';
import { emailAuthConfig } from '../../config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create request URL with email parameter for magic link
    const callbackUrl = `${request.nextUrl.origin}/api/auth/callback/email`;
    const requestUrl = new URL(callbackUrl);
    requestUrl.searchParams.set('email', email);

    const mockRequest = new Request(requestUrl.toString());

    // auth-sdk handles sending the magic link email
    const result = await authenticate(emailAuthConfig, mockRequest);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
    });
  } catch (error) {
    console.error('Email signin error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}
