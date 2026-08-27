import { createSessionCookie, signJWT } from "@warpy-auth-sdk/core";
import { AUTH_SECRET } from "@/lib/auth";

/**
 * Demo sign-in.
 *
 * A real shop would use the SDK's magic link or an OAuth provider; both need
 * mail or client credentials that a public demo cannot ship. This issues the
 * same signed session those flows produce, so every downstream guarantee —
 * delegation, action tokens, receipts — is exercised for real.
 *
 * It is the one piece of this demo you must not copy into production.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const address = (body.email ?? "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return Response.json({ error: "A valid email is required" }, { status: 400 });
  }

  const token = signJWT(
    {
      userId: `user_${Buffer.from(address).toString("hex").slice(0, 12)}`,
      email: address,
      name: address.split("@")[0],
      type: "standard",
    },
    AUTH_SECRET
  );

  const response = Response.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    createSessionCookie({
      user: { id: "", email: address },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token,
    })
  );

  return response;
}
