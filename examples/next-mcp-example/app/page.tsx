"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"login" | "session" | "revoke">("login");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testMCP = async (tool: string, args: any) => {
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, args }),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
            Model Context Protocol
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            MCP Authentication
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
            AI Agent Delegated Authentication for Next.js 16
          </p>
        </header>

        {/* What is MCP */}
        <section className="mb-16 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            What is MCP?
          </h2>
          <p className="mb-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            The Model Context Protocol (MCP) enables AI agents like Claude, ChatGPT, or custom LLMs
            to authenticate on behalf of users with <strong>scoped, time-limited access</strong>.
            This allows AI systems to perform automated tasks, debugging, or read-only operations
            without compromising security.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-900">
              <div className="mb-2 text-2xl">🔒</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Short-Lived Tokens</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Default 15-minute expiration prevents long-term abuse
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-900">
              <div className="mb-2 text-2xl">🎯</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Scope-Based Access</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Granular permissions like debug, read, or admin
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-900">
              <div className="mb-2 text-2xl">⚡</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Token Revocation</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Instantly invalidate tokens if compromised
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="mb-16 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
          <h2 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Try It Out
          </h2>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab("login")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "login"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Agent Login
            </button>
            <button
              onClick={() => setActiveTab("session")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "session"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Get Session
            </button>
            <button
              onClick={() => setActiveTab("revoke")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "revoke"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Revoke Token
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === "login" && (
              <>
                <p className="text-zinc-700 dark:text-zinc-300">
                  Create a short-lived JWT token for an AI agent to authenticate as a user.
                </p>
                <button
                  onClick={() =>
                    testMCP("agent_login", {
                      userId: "demo-user-123",
                      scopes: ["debug", "read"],
                      agentId: "claude-agent",
                      expiresIn: "15m",
                    })
                  }
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {loading ? "Creating Token..." : "Create Agent Token"}
                </button>
              </>
            )}

            {activeTab === "session" && (
              <>
                <p className="text-zinc-700 dark:text-zinc-300">
                  Verify and retrieve session information from a token. You need a valid token first.
                </p>
                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    💡 Tip: Create a token using the Agent Login tab first, then paste it here.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Paste token here..."
                  id="session-token"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  onClick={() => {
                    const token = (document.getElementById("session-token") as HTMLInputElement)?.value;
                    if (token) testMCP("get_session", { token });
                  }}
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {loading ? "Verifying..." : "Verify Token"}
                </button>
              </>
            )}

            {activeTab === "revoke" && (
              <>
                <p className="text-zinc-700 dark:text-zinc-300">
                  Immediately invalidate a token. Once revoked, the token can no longer be used.
                </p>
                <input
                  type="text"
                  placeholder="Paste token to revoke..."
                  id="revoke-token"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  onClick={() => {
                    const token = (document.getElementById("revoke-token") as HTMLInputElement)?.value;
                    if (token) testMCP("revoke_token", { token });
                  }}
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
                >
                  {loading ? "Revoking..." : "Revoke Token"}
                </button>
              </>
            )}

            {/* Response Display */}
            {response && (
              <div className="mt-6">
                <h4 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Response:</h4>
                <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-green-400 dark:bg-zinc-950">
                  {response}
                </pre>
              </div>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
          <h2 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                1
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                  AI Agent Requests Access
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  The agent calls the <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-900">agent_login</code> tool
                  with a user ID, scopes, and expiration time.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                2
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                  Token Generation
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  A JWT token is created with the specified permissions and time limit. The token is
                  marked with type <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-900">mcp-agent</code>
                  to distinguish it from regular user sessions.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                3
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                  Agent Makes Requests
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  The agent uses the token in the <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-900">Authorization</code> header
                  to access protected resources within the defined scopes.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                4
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                  Token Expiry or Revocation
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  Tokens automatically expire after the set duration, or can be manually revoked for immediate
                  invalidation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className="mb-16 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
          <h2 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Code Example
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                Create an agent token:
              </h3>
              <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
{`curl -X POST http://localhost:3000/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "agent_login",
    "args": {
      "userId": "user-123",
      "scopes": ["debug", "read"],
      "agentId": "claude",
      "expiresIn": "15m"
    }
  }'`}
              </pre>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                Use the token to access protected resources:
              </h3>
              <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
{`curl http://localhost:3000/api/protected \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`}
              </pre>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="inline-flex gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Try Google OAuth Login
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-300 px-6 py-3 font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              View Dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
