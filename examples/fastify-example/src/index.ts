import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { registerAuthPlugin } from "@warpy-auth-sdk/core/adapters/fastify";
import {
  google,
  twofa,
  email,
  authenticate,
  createSessionCookie,
  type AuthConfig,
} from "@warpy-auth-sdk/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate environment variables
const requiredEnvVars = ["AUTH_SECRET"];

// Check for authentication provider configurations
const hasGoogleOAuth =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_REDIRECT_URI;

const hasTwoFactorEmail =
  process.env.TWOFA_FROM_EMAIL &&
  (process.env.RESEND_API_KEY ||
    (process.env.SMTP_SERVER &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS));

const hasMagicLink =
  process.env.MAGIC_LINK_FROM_EMAIL &&
  (process.env.RESEND_API_KEY ||
    (process.env.SMTP_SERVER &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS));

if (!hasGoogleOAuth && !hasTwoFactorEmail && !hasMagicLink) {
  console.error(
    "Missing authentication provider configuration. You must configure at least one:"
  );
  console.error(
    "1. Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)"
  );
  console.error(
    "2. Two-Factor Email (TWOFA_FROM_EMAIL + RESEND_API_KEY or SMTP credentials)"
  );
  console.error(
    "3. Magic Link (MAGIC_LINK_FROM_EMAIL + RESEND_API_KEY or SMTP credentials)"
  );
  console.error("Please create a .env file based on .env.example");
  process.exit(1);
}

const missing = requiredEnvVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
  console.error("Please create a .env file based on .env.example");
  process.exit(1);
}

// Create Fastify instance
const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
});

// Register plugins
await fastify.register(fastifyCookie);
await fastify.register(fastifyStatic, {
  root: join(__dirname, "public"),
  prefix: "/",
});

// Configure Google OAuth as primary provider
const googleProvider = google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!,
});

const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: googleProvider,
};

// Register Auth plugin (this will add OAuth routes)
const { requireAuth } = registerAuthPlugin(fastify, authConfig, {
  basePath: "/api/auth",
  successRedirect: "/dashboard",
  errorRedirect: "/login",
});

console.log("✓ Google OAuth provider configured");

// Add 2FA routes manually (separate from the adapter)
if (hasTwoFactorEmail) {
  console.log("✓ Setting up Two-Factor Email authentication");

  const emailService = process.env.RESEND_API_KEY
    ? {
        type: "resend" as const,
        apiKey: process.env.RESEND_API_KEY,
      }
    : {
        type: "nodemailer" as const,
        server: process.env.SMTP_SERVER!,
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
      };

  const twofaProvider = twofa({
    from: process.env.TWOFA_FROM_EMAIL!,
    service: emailService,
    appName: process.env.TWOFA_APP_NAME || "Fastify Auth Example",
    expirationMinutes: parseInt(
      process.env.TWOFA_EXPIRATION_MINUTES || "5",
      10
    ),
  });

  const twofaConfig: AuthConfig = {
    secret: process.env.AUTH_SECRET!,
    provider: twofaProvider,
  };

  // POST /api/auth/signin/twofa - Send verification code
  fastify.post("/api/auth/signin/twofa", async (request, reply) => {
    const body = request.body as { email?: string };
    const email = body?.email;

    if (!email) {
      return reply.code(400).send({ error: "Email is required" });
    }

    const url = `${request.protocol}://${request.hostname}/api/auth/signin/twofa?email=${encodeURIComponent(email)}`;
    const webRequest = new Request(url, {
      method: "GET",
      headers: new Headers(
        Object.entries(request.headers).map(([k, v]) => [k, String(v)])
      ),
    });

    const result = await authenticate(twofaConfig, webRequest);

    if (result.error) {
      return reply.code(400).send({ error: result.error });
    }

    if (result.identifier && result.expiresIn !== undefined) {
      return reply.send({
        identifier: result.identifier,
        expiresIn: result.expiresIn,
      });
    }

    return reply.code(400).send({ error: "Failed to send verification code" });
  });

  // POST /api/auth/verify/twofa - Verify code and create session
  fastify.post("/api/auth/verify/twofa", async (request, reply) => {
    console.log("📨 Received 2FA verification request");
    const body = request.body as { identifier?: string; code?: string };
    const { identifier, code } = body;

    console.log("Identifier:", identifier);
    console.log("Code:", code);

    if (!identifier || !code) {
      console.log("❌ Missing identifier or code");
      return reply
        .code(400)
        .send({ error: "Identifier and code are required" });
    }

    const url = `${request.protocol}://${request.hostname}/api/auth/verify/twofa?identifier=${encodeURIComponent(identifier)}&code=${encodeURIComponent(code)}`;
    const webRequest = new Request(url, {
      method: "GET",
      headers: new Headers(
        Object.entries(request.headers).map(([k, v]) => [k, String(v)])
      ),
    });

    console.log("🔐 Authenticating with SDK...");
    const result = await authenticate(twofaConfig, webRequest);

    console.log("Authentication result:", result.error ? `Error: ${result.error}` : "Success");

    if (result.error || !result.session) {
      console.log("❌ Authentication failed");
      return reply
        .code(400)
        .send({ error: result.error || "Verification failed" });
    }

    console.log("✅ Authentication successful, setting cookie");
    reply.header("set-cookie", createSessionCookie(result.session));
    return reply.send({ success: true, session: result.session });
  });

  console.log("✓ Two-Factor Email routes registered");
}

// Add Magic Link routes manually (separate from the adapter)
if (hasMagicLink) {
  console.log("✓ Setting up Magic Link authentication");

  const emailService = process.env.RESEND_API_KEY
    ? {
        type: "resend" as const,
        apiKey: process.env.RESEND_API_KEY,
      }
    : {
        type: "nodemailer" as const,
        server: process.env.SMTP_SERVER!,
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
      };

  const magicLinkProvider = email({
    from: process.env.MAGIC_LINK_FROM_EMAIL!,
    service: emailService,
    appName: process.env.MAGIC_LINK_APP_NAME || "Fastify Auth Example",
    expirationMinutes: parseInt(
      process.env.MAGIC_LINK_EXPIRATION_MINUTES || "15",
      10
    ),
  });

  const magicLinkConfig: AuthConfig = {
    secret: process.env.AUTH_SECRET!,
    provider: magicLinkProvider,
  };

  // POST /api/auth/signin/email - Send magic link
  fastify.post("/api/auth/signin/email", async (request, reply) => {
    const body = request.body as { email?: string };
    const emailAddr = body?.email;

    if (!emailAddr) {
      return reply.code(400).send({ error: "Email is required" });
    }

    const url = `${request.protocol}://${request.hostname}/api/auth/signin/email?email=${encodeURIComponent(emailAddr)}`;
    const webRequest = new Request(url, {
      method: "GET",
      headers: new Headers(
        Object.entries(request.headers).map(([k, v]) => [k, String(v)])
      ),
    });

    const result = await authenticate(magicLinkConfig, webRequest);

    if (result.error) {
      return reply.code(400).send({ error: result.error });
    }

    return reply.send({ success: true, message: "Magic link sent to your email" });
  });

  // GET /api/auth/callback/email - Verify magic link token
  fastify.get("/api/auth/callback/email", async (request, reply) => {
    const url = `${request.protocol}://${request.hostname}${request.url}`;
    const webRequest = new Request(url, {
      method: "GET",
      headers: new Headers(
        Object.entries(request.headers).map(([k, v]) => [k, String(v)])
      ),
    });

    const result = await authenticate(magicLinkConfig, webRequest);

    if (result.error || !result.session) {
      return reply.redirect(
        `/login?error=${encodeURIComponent(result.error || "Authentication failed")}`,
        302
      );
    }

    reply.header("set-cookie", createSessionCookie(result.session));
    return reply.redirect("/dashboard", 302);
  });

  console.log("✓ Magic Link routes registered");
}

// Serve HTML pages
fastify.get("/", async (_request, reply) => {
  return reply.sendFile("index.html");
});

fastify.get("/login", async (_request, reply) => {
  return reply.sendFile("login.html");
});

fastify.get("/dashboard", async (_request, reply) => {
  return reply.sendFile("dashboard.html");
});

fastify.get("/verify", async (_request, reply) => {
  return reply.sendFile("verify.html");
});

// Example protected API using preHandler
fastify.get("/api/user", { preHandler: requireAuth }, async (request) => {
  return { user: (request as any).session.user };
});

// Health check
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000", 10);
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`\n🚀 Server running at http://localhost:${port}`);
    console.log(`📝 Login page: http://localhost:${port}/login`);
    console.log(`🔐 Dashboard: http://localhost:${port}/dashboard\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
