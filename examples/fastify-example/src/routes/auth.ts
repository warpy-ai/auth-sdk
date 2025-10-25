import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  authenticate,
  getSession,
  signOut,
  createSessionCookie,
  clearSessionCookie,
  google,
  type AuthConfig,
  type Session,
} from "@warpy-auth-sdk/core";

// Helper to convert Fastify request to Web Standard Request
function toWebRequest(request: FastifyRequest): Request {
  const url = `${request.protocol}://${request.hostname}${request.url}`;
  const headers = new Headers();

  Object.entries(request.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, String(value));
      }
    }
  });

  return new Request(url, {
    method: request.method,
    headers,
  });
}

// Helper to convert Set-Cookie header to Fastify cookie
function setCookieFromHeader(reply: FastifyReply, setCookieHeader: string) {
  // Parse the Set-Cookie header manually
  const parts = setCookieHeader.split(";").map((p) => p.trim());
  const [cookiePair] = parts;
  const [name, value] = cookiePair.split("=");

  const options: any = {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  // Parse options from header
  parts.slice(1).forEach((part) => {
    const [key, val] = part.split("=");
    const lowerKey = key.toLowerCase();

    if (lowerKey === "max-age") {
      options.maxAge = parseInt(val, 10);
    } else if (lowerKey === "expires") {
      options.expires = new Date(val);
    } else if (lowerKey === "domain") {
      options.domain = val;
    } else if (lowerKey === "secure") {
      options.secure = true;
    } else if (lowerKey === "samesite") {
      options.sameSite = val.toLowerCase();
    }
  });

  reply.setCookie(name, value || "", options);
}

export default async function authRoutes(fastify: FastifyInstance) {
  const authConfig: AuthConfig = {
    secret: process.env.AUTH_SECRET!,
    provider: google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    }),
    callbacks: {
      // Example: Resolve user from your database
      async user(u) {
        // In a real app, query your database here
        console.log("User authenticated:", u.email);
        return {
          id: u.id || u.email.split("@")[0],
          email: u.email,
          name: u.name,
          picture: u.picture,
        };
      },
    },
  };

  // GET /auth/session - Get current session
  fastify.get("/auth/session", async (request, reply) => {
    try {
      const webRequest = toWebRequest(request);
      const session = await getSession(webRequest, authConfig.secret);

      return reply.send({ session });
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  });

  // POST /auth/signout - Sign out user
  fastify.post("/auth/signout", async (request, reply) => {
    try {
      const webRequest = toWebRequest(request);
      await signOut(webRequest, authConfig);

      const clearCookie = clearSessionCookie();
      setCookieFromHeader(reply, clearCookie);

      return reply.send({ success: true });
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  });

  // GET /auth/signin/google - Start Google OAuth flow
  fastify.get("/auth/signin/google", async (request, reply) => {
    try {
      const webRequest = toWebRequest(request);
      const result = await authenticate(authConfig, webRequest);

      if (result.redirectUrl) {
        // Set PKCE verifier cookie if provided
        if (result.cookies && result.cookies.length > 0) {
          result.cookies.forEach((cookie) => {
            setCookieFromHeader(reply, cookie);
          });
        }
        return reply.redirect(result.redirectUrl, 302);
      }

      return reply.code(400).send({
        error: result.error || "Failed to start sign in",
      });
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  });

  // GET /api/auth/callback/google - Alias for /api base path
  fastify.get("/api/auth/callback/google", async (request, reply) => {
    try {
      const webRequest = toWebRequest(request);
      const result = await authenticate(authConfig, webRequest);

      if (result.error || !result.session) {
        return reply.redirect(
          `/login?error=${encodeURIComponent(result.error || "Authentication failed")}`,
          302
        );
      }

      // Set session cookie
      const sessionCookie = createSessionCookie(result.session);
      setCookieFromHeader(reply, sessionCookie);

      // Clear PKCE verifier cookie if provided
      if (result.cookies && result.cookies.length > 0) {
        result.cookies.forEach((cookie) => {
          setCookieFromHeader(reply, cookie);
        });
      }

      return reply.redirect("/dashboard", 302);
    } catch (error) {
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Internal Server Error"
        )}`,
        302
      );
    }
  });

  // Helper endpoint to get current user (for client-side)
  fastify.get("/api/user", async (request, reply) => {
    try {
      const webRequest = toWebRequest(request);
      const session = await getSession(webRequest, authConfig.secret);

      if (!session) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      return reply.send({ user: session.user });
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  });
}
