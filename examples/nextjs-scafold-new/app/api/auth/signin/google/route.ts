import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@auth-sdk/core";
import { googleAuthConfig } from "../../config";

export async function GET(request: NextRequest) {
  try {
    const result = await authenticate(googleAuthConfig, request);

    if (result.redirectUrl) {
      return NextResponse.redirect(result.redirectUrl);
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  } catch (error) {
    console.error("Google signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
