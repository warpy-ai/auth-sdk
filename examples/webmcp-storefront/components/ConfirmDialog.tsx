"use client";
import { useCallback, useRef, useState } from "react";
import type { ConfirmRequest } from "@warpy-auth-sdk/core/webmcp";

/**
 * The shop's own confirmation UI, handed to the SDK as `policy.confirmHandler`.
 *
 * The default is `window.confirm`, which works but tells the person very little.
 * This shows what the agent is about to do, with what arguments, and what it
 * will cost — which is the whole point of the gate.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolver = useRef<((approved: boolean) => void) | null>(null);

  const confirmHandler = useCallback(
    (incoming: ConfirmRequest) =>
      new Promise<boolean>((resolve) => {
        setRequest(incoming);
        resolver.current = resolve;
      }),
    []
  );

  const settle = useCallback((approved: boolean) => {
    resolver.current?.(approved);
    resolver.current = null;
    setRequest(null);
  }, []);

  const dialog = request ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      // The agent must never be able to read or drive its own permission prompt.
      data-agent-ignore
    >
      <div className="panel w-full max-w-md p-5">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: request.destructive ? "#e5735a" : "#7bc47f" }}
          />
          <h2 id="confirm-title" className="text-sm font-semibold">
            An agent wants to run{" "}
            <code className="text-[var(--accent)]">{request.tool}</code>
          </h2>
        </div>

        <p className="mb-3 whitespace-pre-line text-sm muted">
          {request.message}
        </p>

        {Object.keys(request.args).length > 0 && (
          <pre className="mb-4 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-xs muted">
            {JSON.stringify(request.args, null, 2)}
          </pre>
        )}

        {request.scopes.length > 0 && (
          <p className="mb-4 text-xs muted">
            Using delegated access: {request.scopes.join(", ")}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button className="btn" onClick={() => settle(false)}>
            Decline
          </button>
          <button className="btn btn-primary" onClick={() => settle(true)}>
            Allow
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirmHandler, dialog };
}
