import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth-sdk";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request, process.env.AUTH_SECRET!);

    if (!session) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
