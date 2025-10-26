import "dotenv/config";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { registerAuthRoutes } from "@warpy-auth-sdk/core/adapters/hono";
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

// Create Hono app
const app = new Hono();

// Configure Auth SDK (Google OAuth as example)
const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  }),
};

// Register Auth routes (adds /api/auth routes)
const { requireAuth } = registerAuthRoutes(app, authConfig, {
  basePath: "/api/auth",
  successRedirect: "/dashboard",
  errorRedirect: "/login",
});

// Serve static files
app.use("/public/*", serveStatic({ root: "./src" }));

// Serve HTML pages
app.get("/", (c) => {
  const html = readFileSync(join(__dirname, "public", "index.html"), "utf-8");
  return c.html(html);
});

app.get("/login", (c) => {
  const html = readFileSync(join(__dirname, "public", "login.html"), "utf-8");
  return c.html(html);
});

app.get("/dashboard", (c) => {
  const html = readFileSync(join(__dirname, "public", "dashboard.html"), "utf-8");
  return c.html(html);
});

// Example protected API using requireAuth middleware
app.get("/api/user", requireAuth, (c) => {
  const session = c.get("session");
  return c.json({ user: session.user });
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

console.log(`\n🚀 Server running at http://localhost:${port}`);
console.log(`📝 Login page: http://localhost:${port}/login`);
console.log(`🔐 Dashboard: http://localhost:${port}/dashboard\n`);

serve({
  fetch: app.fetch,
  port,
  hostname: host,
});
