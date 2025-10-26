import "dotenv/config";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import { createAuthHandler } from "@warpy-auth-sdk/core/adapters/node";
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

// Configure Auth SDK (Google OAuth as example)
const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  }),
};

// Create auth handler
const { handler: authHandler, requireAuth } = createAuthHandler(authConfig, {
  basePath: "/api/auth",
  successRedirect: "/dashboard",
  errorRedirect: "/login",
});

// Helper to serve HTML files
function serveHTML(res: any, filename: string) {
  try {
    const content = readFileSync(join(__dirname, "public", filename), "utf-8");
    res.statusCode = 200;
    res.setHeader("content-type", "text/html");
    res.end(content);
  } catch (error) {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain");
    res.end("Not Found");
  }
}

// Helper to send JSON
function sendJSON(res: any, data: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
}

// Create HTTP server
const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Try auth handler first
  const handled = await authHandler(req, res);
  if (handled) return;

  // Serve HTML pages
  if (pathname === "/" && req.method === "GET") {
    return serveHTML(res, "index.html");
  }

  if (pathname === "/login" && req.method === "GET") {
    return serveHTML(res, "login.html");
  }

  if (pathname === "/dashboard" && req.method === "GET") {
    return serveHTML(res, "dashboard.html");
  }

  // Protected API endpoint
  if (pathname === "/api/user" && req.method === "GET") {
    const authenticated = await requireAuth(req, res);
    if (!authenticated) return; // requireAuth already sent response
    return sendJSON(res, { user: req.session?.user });
  }

  // Health check
  if (pathname === "/health" && req.method === "GET") {
    return sendJSON(res, { status: "ok", timestamp: new Date().toISOString() });
  }

  // 404
  res.statusCode = 404;
  res.setHeader("content-type", "text/plain");
  res.end("Not Found");
});

// Start server
const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
  console.log(`\n🚀 Server running at http://localhost:${port}`);
  console.log(`📝 Login page: http://localhost:${port}/login`);
  console.log(`🔐 Dashboard: http://localhost:${port}/dashboard\n`);
});
