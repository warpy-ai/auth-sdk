import { authorizeWebMCPRequest, getSession } from "@warpy-auth-sdk/core";
import { AUTH_SECRET } from "./auth";

/**
 * One guard for every route an agent can reach.
 *
 * A human with a session is allowed on the session alone — scopes gate agents,
 * not people. An agent must additionally present a delegation covering the
 * scopes the route names.
 */
export async function requireAccess(request: Request, scopes: string[] = []) {
  const access = await authorizeWebMCPRequest(
    request,
    { secret: AUTH_SECRET },
    scopes
  );

  if (!access.allowed) {
    return {
      ok: false as const,
      response: Response.json(
        { error: access.reason },
        { status: access.actor === "anonymous" ? 401 : 403 }
      ),
    };
  }

  return {
    ok: true as const,
    userId: access.userId as string,
    actor: access.actor,
    agentId: access.agentId,
  };
}

/** Resolves the signed-in shopper without imposing any scope requirement. */
export async function currentUserId(
  request: Request
): Promise<string | null> {
  const session = await getSession(request, AUTH_SECRET);
  return session?.user.id ?? null;
}
