import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { registerAuthPlugin } from "@warpy-auth-sdk/core/adapters/fastify";
import { google, type AuthConfig } from "@warpy-auth-sdk/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate environment variables
const requiredEnvVars = [
  "AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
];

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

// Configure Auth SDK (Google OAuth as example)
const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  }),
};

// Register Auth plugin (adds /auth routes)
const { requireAuth } = registerAuthPlugin(fastify, authConfig, {
  basePath: "/api/auth",
  successRedirect: "/dashboard",
  errorRedirect: "/login",
});

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
