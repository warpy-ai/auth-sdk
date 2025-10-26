import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { registerAuthRoutes } from "@warpy-auth-sdk/core/adapters/express";
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

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));

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

// Serve HTML pages
app.get("/", (_req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(join(__dirname, "public", "login.html"));
});

app.get("/dashboard", (_req, res) => {
  res.sendFile(join(__dirname, "public", "dashboard.html"));
});

// Example protected API using requireAuth middleware
app.get("/api/user", requireAuth, (req, res) => {
  res.json({ user: (req as any).session.user });
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`\n🚀 Server running at http://localhost:${port}`);
  console.log(`📝 Login page: http://localhost:${port}/login`);
  console.log(`🔐 Dashboard: http://localhost:${port}/dashboard\n`);
});
