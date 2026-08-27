import { describe, it, expect, vi } from "vitest";
import { createAuthTools } from "../auth-tools";
import { GrantStore } from "../grant";
import { RateLimiter, guardTool, type GuardContext } from "../policy";
import { resolveEndpoints } from "../client";
import type {
  ToolResponse,
  WebMCPSession,
  WebMCPToolDefinition,
} from "../types";

const endpoints = resolveEndpoints("/api/auth");

const signedIn: WebMCPSession = {
  user: { id: "user-1", email: "a@b.co", name: "Ada" },
  type: "standard",
};

function setup(
  options: {
    session?: WebMCPSession | null;
    approve?: boolean;
    allowedScopes?: string[];
    fetchImpl?: typeof fetch;
  } = {}
) {
  const grants = new GrantStore();
  const fetchImpl =
    options.fetchImpl ??
    (vi.fn(async (url: string) => {
      if (url.endsWith("/webmcp/grant")) {
        return new Response(
          JSON.stringify({
            token: "delegation-token",
            agentId: "webmcp-agent",
            scopes: ["orders:read"],
            expires: new Date(Date.now() + 900_000).toISOString(),
          }),
          { status: 200 }
        );
      }
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch);

  const context: GuardContext = {
    policy: { confirmHandler: () => options.approve ?? true },
    endpoints,
    grants,
    getSession: async () => options.session ?? null,
    rateLimiter: new RateLimiter({ limit: 30, windowMs: 60_000 }),
    fetchImpl,
  };

  const definitions = createAuthTools({
    endpoints,
    grants,
    ...(options.allowedScopes ? { allowedScopes: options.allowedScopes } : {}),
  });

  const byName = new Map<string, WebMCPToolDefinition>(
    definitions.map((tool) => [tool.name, tool])
  );

  const call = async (
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<ToolResponse> => {
    const tool = byName.get(name);
    if (!tool) throw new Error(`no tool ${name}`);
    return (await guardTool(tool, context).execute(args)) as ToolResponse;
  };

  return { grants, call, fetchImpl, names: Array.from(byName.keys()) };
}

function body(response: ToolResponse): Record<string, unknown> {
  return (response.structuredContent ?? {}) as Record<string, unknown>;
}

describe("auth tools", () => {
  it("does not expose a two-factor tool unless explicitly enabled", () => {
    const { names } = setup();
    expect(names).not.toContain("auth_verify_two_factor");

    const withTwoFactor = createAuthTools({
      endpoints,
      grants: new GrantStore(),
      twoFactor: true,
    });
    expect(withTwoFactor.map((t) => t.name)).toContain(
      "auth_verify_two_factor"
    );
  });

  it("reports an anonymous visitor without leaking anything", async () => {
    const { call } = setup();
    expect(body(await call("auth_get_session"))).toEqual({
      authenticated: false,
    });
  });

  it("never returns the session token to the agent", async () => {
    const { call } = setup({
      session: { ...signedIn, token: "super-secret" } as WebMCPSession & {
        token: string;
      },
    });

    const result = await call("auth_get_session");
    expect(JSON.stringify(result)).not.toContain("super-secret");
    expect(body(result)).toMatchObject({
      authenticated: true,
      user: { id: "user-1" },
    });
  });

  it("requires a signed-in user before delegating", async () => {
    const { call } = setup();
    const result = await call("auth_request_access", {
      scopes: ["orders:read"],
    });

    expect(body(result).error).toBe("unauthenticated");
  });

  it("stores a delegation once the person approves, without giving the agent the token", async () => {
    const { call, grants } = setup({ session: signedIn, approve: true });

    const result = await call("auth_request_access", {
      scopes: ["orders:read"],
      reason: "look up my last order",
    });

    expect(body(result)).toMatchObject({
      granted: true,
      scopes: ["orders:read"],
    });
    expect(JSON.stringify(result)).not.toContain("delegation-token");
    expect(grants.has(["orders:read"])).toBe(true);
  });

  it("stores nothing when the person declines", async () => {
    const { call, grants } = setup({ session: signedIn, approve: false });

    const result = await call("auth_request_access", {
      scopes: ["orders:read"],
    });

    expect(body(result).error).toBe("declined_by_user");
    expect(grants.get()).toBeNull();
  });

  it("refuses scopes the page does not delegate, before asking the server", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const { call } = setup({
      session: signedIn,
      approve: true,
      allowedScopes: ["orders:read"],
      fetchImpl,
    });

    const result = await call("auth_request_access", { scopes: ["admin"] });

    expect(body(result).error).toBe("policy");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("drops the delegation on revoke", async () => {
    const { call, grants } = setup({ session: signedIn, approve: true });
    await call("auth_request_access", { scopes: ["orders:read"] });

    expect(body(await call("auth_revoke_access"))).toMatchObject({
      revoked: true,
    });
    expect(grants.get()).toBeNull();
  });

  it("validates the email before sending a magic link", async () => {
    const { call, fetchImpl } = setup({ approve: true });

    const result = await call("auth_sign_in_email", { email: "not-an-email" });

    expect(body(result).error).toBe("invalid_arguments");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends a magic link and says the agent cannot finish the sign-in", async () => {
    const { call } = setup({ approve: true });

    const result = await call("auth_sign_in_email", {
      email: "ada@example.com",
    });

    expect(body(result)).toMatchObject({
      sent: true,
      email: "ada@example.com",
    });
    expect(String(body(result).message)).toContain("cannot complete sign-in");
  });

  it("rate limits magic link requests", async () => {
    const { call } = setup({ approve: true });

    for (let i = 0; i < 3; i += 1) {
      await call("auth_sign_in_email", { email: "ada@example.com" });
    }
    const fourth = await call("auth_sign_in_email", {
      email: "ada@example.com",
    });

    expect(body(fourth).error).toBe("rate_limited");
  });

  it("describes the access the agent currently holds", async () => {
    const { call } = setup({
      session: signedIn,
      approve: true,
      allowedScopes: ["orders:read", "orders:write"],
    });

    expect(body(await call("auth_describe_access"))).toMatchObject({
      granted: false,
      requestableScopes: ["orders:read", "orders:write"],
    });

    await call("auth_request_access", { scopes: ["orders:read"] });

    expect(body(await call("auth_describe_access"))).toMatchObject({
      granted: true,
      scopes: ["orders:read"],
    });
  });
});
