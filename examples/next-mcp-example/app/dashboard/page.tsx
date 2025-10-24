"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [agentToken, setAgentToken] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setSession(d.session));
  }, []);

  async function createAgentToken() {
    const res = await fetch("/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "agent_login",
        args: {
          userId: session?.user?.id || "user-1",
          scopes: ["debug", "read"],
          agentId: "dev-agent",
          expiresIn: "15m",
        },
      }),
    });
    const data = await res.json();
    setAgentToken(data.token || "");
    setResult(data);
  }

  async function readAgentSession() {
    const res = await fetch("/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "get_session",
        args: { token: agentToken },
      }),
    });
    setResult(await res.json());
  }

  async function revokeAgentToken() {
    const res = await fetch("/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "revoke_token",
        args: { token: agentToken },
      }),
    });
    setResult(await res.json());
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={createAgentToken}>Create Agent Token</button>
        <button onClick={readAgentSession} disabled={!agentToken}>
          Get Agent Session
        </button>
        <button onClick={revokeAgentToken} disabled={!agentToken}>
          Revoke Token
        </button>
      </div>
      {agentToken && (
        <div>
          <h3>Agent Token</h3>
          <code style={{ wordBreak: "break-all" }}>{agentToken}</code>
        </div>
      )}
      {result && (
        <div>
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
