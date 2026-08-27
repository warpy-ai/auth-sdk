"use client";
import { useState } from "react";
import { useWebMCP } from "@warpy-auth-sdk/core/webmcp/react";
import { useAudit } from "@/components/audit";

/**
 * A window onto what the agent is doing.
 *
 * Consent the person cannot see is not really consent, so this page shows the
 * registered tools, the scopes currently delegated, what has been paid for, and
 * every gate decision as it happens — and lets you revoke it all in one click.
 */
export default function AgentPanel() {
  const { supported, tools, grantedScopes, receipts, revokeAccess, handle } =
    useWebMCP();
  const { events, clear } = useAudit();
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");

  // Lets you drive a tool by hand, exactly as an agent would, without needing a
  // WebMCP-capable browser to try the demo.
  const run = async (name: string, args: Record<string, unknown> = {}) => {
    if (!handle) return;
    setRunning(name);
    const response = await handle.execute(name, args);
    setResult(JSON.stringify(response.structuredContent ?? response, null, 2));
    setRunning(null);
  };

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <h1 className="text-lg font-semibold">Agent panel</h1>
        <p className="mt-1 text-sm muted">
          {supported
            ? "This browser implements WebMCP. Tools are registered on document.modelContext and an in-tab agent can call them."
            : "This browser has no WebMCP implementation, so tools are published on window.__webmcp__ instead. Everything below still works — try the buttons."}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-semibold">
            Registered tools ({tools.length})
          </h2>
          <ul className="space-y-1.5">
            {tools.map((name) => (
              <li key={name} className="flex items-center justify-between gap-2">
                <code className="text-xs">{name}</code>
                <button
                  className="btn text-xs"
                  disabled={running !== null}
                  onClick={() =>
                    run(
                      name,
                      name.includes("search")
                        ? { query: "something rare for a gift" }
                        : {}
                    )
                  }
                >
                  {running === name ? "…" : "Run"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-semibold">Delegated access</h2>
          {grantedScopes.length === 0 ? (
            <p className="text-xs muted">
              Nothing delegated. An agent must call{" "}
              <code>auth_request_access</code> and you must approve before any
              scoped tool will run.
            </p>
          ) : (
            <>
              <ul className="mb-3 flex flex-wrap gap-1.5">
                {grantedScopes.map((scope) => (
                  <li key={scope} className="tag" style={{ color: "var(--accent)" }}>
                    {scope}
                  </li>
                ))}
              </ul>
              <button className="btn" onClick={revokeAccess}>
                Revoke access
              </button>
            </>
          )}

          <h2 className="mb-2 mt-5 text-sm font-semibold">Paid for</h2>
          {receipts.length === 0 ? (
            <p className="text-xs muted">Nothing paid for yet.</p>
          ) : (
            <ul className="space-y-1 text-xs muted">
              {receipts.map((receipt) => (
                <li key={receipt.tool}>
                  <code>{receipt.tool}</code> — {receipt.calls} calls left
                  {receipt.transaction && ` · ${receipt.transaction.slice(0, 12)}…`}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {result && (
        <section className="panel p-5">
          <h2 className="mb-2 text-sm font-semibold">Last result</h2>
          <pre className="max-h-72 overflow-auto rounded-lg bg-black/40 p-3 text-xs muted">
            {result}
          </pre>
        </section>
      )}

      <section className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Audit log ({events.length})</h2>
          <button className="btn text-xs" onClick={clear}>
            Clear
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-xs muted">
            Every tool call is recorded here: what was attempted, whether it was
            allowed, and why not when it was refused. Arguments are redacted
            before they reach this log.
          </p>
        ) : (
          <ul className="space-y-1 font-mono text-xs">
            {events.map((event) => (
              <li key={`${event.id}-${event.phase}-${event.receivedAt}`}>
                <span style={{ color: phaseColor(event.phase) }}>
                  {event.phase.padEnd(8)}
                </span>{" "}
                <span>{event.tool}</span>{" "}
                {event.reason && (
                  <span style={{ color: "#e5735a" }}>{event.reason}</span>
                )}{" "}
                {event.durationMs !== undefined && (
                  <span className="muted">{event.durationMs}ms</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function phaseColor(phase: string): string {
  if (phase === "denied") return "#e5735a";
  if (phase === "success") return "#7bc47f";
  if (phase === "allowed") return "#c8a25e";
  return "#9b9ba5";
}
