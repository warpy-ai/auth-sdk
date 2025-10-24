import { NextRequest, NextResponse } from "next/server";
import { signOut, clearSessionCookie } from "auth-sdk";

export async function POST(request: NextRequest) {
  try {
    await signOut(request, { secret: process.env.AUTH_SECRET! } as any);

    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", clearSessionCookie());

    return response;
  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
