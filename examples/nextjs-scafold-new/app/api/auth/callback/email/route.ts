import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSessionCookie } from "@auth-sdk/core";
import { emailAuthConfig } from "../../config";

export async function GET(request: NextRequest) {
  try {
    // auth-sdk handles token verification
    const result = await authenticate(emailAuthConfig, request);

    if (result.error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error)}`, request.url)
      );
    }

    if (result.session) {
      const sessionCookie = createSessionCookie(result.session);
      const response = NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
      response.headers.set("Set-Cookie", sessionCookie);
      return response;
    }

    return NextResponse.redirect(
      new URL("/login?error=no_session", request.url)
    );
  } catch (error) {
    console.error("Email callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=server_error", request.url)
    );
  }
}
