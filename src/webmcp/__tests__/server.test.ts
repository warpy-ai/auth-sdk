import { describe, it, expect, vi } from "vitest";
import {
  authorizeWebMCPRequest,
  createMemoryNonceStore,
  createWebMCPHandler,
  issueActionToken,
  issueGrant,
  revokeGrant,
  verifyWebMCPAction,
} from "../server";
import type { AuthConfig } from "../../core";
import { signJWT } from "../../utils/jwt";
import { SESSION_COOKIE_NAME } from "../../utils/cookie";
import type { Provider } from "../../providers/types";

const SECRET = "test-secret-value";

const config: AuthConfig = {
  secret: SECRET,
  provider: {} as Provider,
  mcp: { enabled: true },
};

function userCookie(userId = "user-1"): string {
  const token = signJWT({ userId, email: "a@b.co", type: "standard" }, SECRET);
  return `${SESSION_COOKIE_NAME}=${token}`;
}

function post(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function grantToken(scopes: string[], options = {}): Promise<string> {
  const response = await issueGrant(
    post(
      "https://app.test/api/auth/webmcp/grant",
      { scopes, agentId: "agent-1" },
      {
        cookie: userCookie(),
      }
    ),
    config,
    options
  );
  const body = (await response.json()) as { token: string };
  return body.token;
}

describe("issueGrant", () => {
  it("refuses when no user is signed in", async () => {
    const response = await issueGrant(
      post("https://app.test/api/auth/webmcp/grant", { scopes: ["read"] }),
      config
    );

    expect(response.status).toBe(401);
  });

  it("issues a scoped, expiring delegation for a signed-in user", async () => {
    const response = await issueGrant(
      post(
        "https://app.test/api/auth/webmcp/grant",
        { scopes: ["orders:read"], agentId: "agent-1" },
        { cookie: userCookie() }
      ),
      config
    );

    const body = (await response.json()) as {
      token: string;
      scopes: string[];
      expires: string;
    };

    expect(response.status).toBe(200);
    expect(body.scopes).toEqual(["orders:read"]);
    expect(new Date(body.expires).getTime()).toBeGreaterThan(Date.now());
  });

  it("refuses scopes the server does not delegate", async () => {
    const response = await issueGrant(
      post(
        "https://app.test/api/auth/webmcp/grant",
        { scopes: ["billing:write"] },
        { cookie: userCookie() }
      ),
      config,
      { allowedScopes: ["orders:read"] }
    );

    expect(response.status).toBe(403);
  });

  it("caps the delegation lifetime at the configured maximum", async () => {
    const response = await issueGrant(
      post(
        "https://app.test/api/auth/webmcp/grant",
        { scopes: ["read"], expiresIn: "30d" },
        { cookie: userCookie() }
      ),
      config,
      { maxGrantSeconds: 60 }
    );

    const body = (await response.json()) as { expires: string };
    const ttl = new Date(body.expires).getTime() - Date.now();
    expect(ttl).toBeLessThanOrEqual(61_000);
  });

  it("honours an onGrant veto", async () => {
    const onGrant = vi.fn().mockReturnValue(false);
    const response = await issueGrant(
      post(
        "https://app.test/api/auth/webmcp/grant",
        { scopes: ["read"], reason: "debugging" },
        { cookie: userCookie() }
      ),
      config,
      { onGrant }
    );

    expect(response.status).toBe(403);
    expect(onGrant).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", reason: "debugging" })
    );
  });

  it("refuses to mint a delegation from a delegation", async () => {
    const token = await grantToken(["read"]);

    // An agent token presented as the session cookie must not bootstrap another.
    const response = await issueGrant(
      post(
        "https://app.test/api/auth/webmcp/grant",
        { scopes: ["admin"] },
        { cookie: `${SESSION_COOKIE_NAME}=${token}` }
      ),
      config
    );

    expect(response.status).toBe(401);
  });
});

describe("action tokens", () => {
  it("mints a single-use token bound to the tool", async () => {
    const token = await grantToken(["orders:write"]);

    const response = await issueActionToken(
      post(
        "https://app.test/api/auth/webmcp/action",
        { tool: "place_order" },
        { authorization: `Bearer ${token}` }
      ),
      config
    );

    const body = (await response.json()) as { token: string };
    const request = new Request("https://app.test/api/orders", {
      method: "POST",
      headers: {
        "x-webmcp-action": body.token,
        "x-webmcp-tool": "place_order",
      },
    });

    const claims = await verifyWebMCPAction(request, SECRET, {
      tool: "place_order",
      scopes: ["orders:write"],
      nonceStore: createMemoryNonceStore(),
    });

    expect(claims).toMatchObject({
      userId: "user-1",
      agentId: "agent-1",
      tool: "place_order",
      type: "webmcp-action",
    });
  });

  it("rejects a replayed action token", async () => {
    const token = await grantToken(["orders:write"]);
    const minted = (await (
      await issueActionToken(
        post(
          "https://app.test/api/auth/webmcp/action",
          { tool: "place_order" },
          { authorization: `Bearer ${token}` }
        ),
        config
      )
    ).json()) as { token: string };

    const store = createMemoryNonceStore();
    const request = () =>
      new Request("https://app.test/api/orders", {
        method: "POST",
        headers: { "x-webmcp-action": minted.token },
      });

    expect(
      await verifyWebMCPAction(request(), SECRET, { nonceStore: store })
    ).not.toBeNull();
    expect(
      await verifyWebMCPAction(request(), SECRET, { nonceStore: store })
    ).toBeNull();
  });

  it("rejects a token minted for a different tool", async () => {
    const token = await grantToken(["orders:write"]);
    const minted = (await (
      await issueActionToken(
        post(
          "https://app.test/api/auth/webmcp/action",
          { tool: "place_order" },
          { authorization: `Bearer ${token}` }
        ),
        config
      )
    ).json()) as { token: string };

    const claims = await verifyWebMCPAction(
      new Request("https://app.test/api/refunds", {
        headers: { "x-webmcp-action": minted.token },
      }),
      SECRET,
      { tool: "issue_refund", nonceStore: createMemoryNonceStore() }
    );

    expect(claims).toBeNull();
  });

  it("rejects a token that lacks the required scope", async () => {
    const token = await grantToken(["orders:read"]);
    const minted = (await (
      await issueActionToken(
        post(
          "https://app.test/api/auth/webmcp/action",
          { tool: "place_order" },
          { authorization: `Bearer ${token}` }
        ),
        config
      )
    ).json()) as { token: string };

    const claims = await verifyWebMCPAction(
      new Request("https://app.test/api/orders", {
        headers: { "x-webmcp-action": minted.token },
      }),
      SECRET,
      { scopes: ["orders:write"], nonceStore: createMemoryNonceStore() }
    );

    expect(claims).toBeNull();
  });

  it("refuses to mint an action token without a delegation", async () => {
    const response = await issueActionToken(
      post("https://app.test/api/auth/webmcp/action", { tool: "x" }),
      config
    );

    expect(response.status).toBe(401);
  });

  it("stops minting once the delegation is revoked", async () => {
    const token = await grantToken(["orders:write"]);

    await revokeGrant(
      post("https://app.test/api/auth/webmcp/revoke", { token }),
      config
    );

    const response = await issueActionToken(
      post(
        "https://app.test/api/auth/webmcp/action",
        { tool: "place_order" },
        { authorization: `Bearer ${token}` }
      ),
      config
    );

    expect(response.status).toBe(401);
  });
});

describe("authorizeWebMCPRequest", () => {
  it("identifies a human caller with a session", async () => {
    const result = await authorizeWebMCPRequest(
      new Request("https://app.test/api/orders", {
        headers: { cookie: userCookie("user-7") },
      }),
      { secret: SECRET },
      ["orders:write"]
    );

    expect(result).toMatchObject({
      allowed: true,
      actor: "human",
      userId: "user-7",
    });
  });

  it("refuses an agent call with no delegation", async () => {
    const result = await authorizeWebMCPRequest(
      new Request("https://app.test/api/orders", {
        method: "POST",
        headers: { "x-webmcp-tool": "place_order", cookie: userCookie() },
      }),
      { secret: SECRET },
      ["orders:write"]
    );

    expect(result.allowed).toBe(false);
    expect(result.actor).toBe("agent");
  });

  it("allows an agent call carrying the right delegation", async () => {
    const token = await grantToken(["orders:write"]);
    const minted = (await (
      await issueActionToken(
        post(
          "https://app.test/api/auth/webmcp/action",
          { tool: "place_order" },
          { authorization: `Bearer ${token}` }
        ),
        config
      )
    ).json()) as { token: string };

    const result = await authorizeWebMCPRequest(
      new Request("https://app.test/api/orders", {
        method: "POST",
        headers: {
          "x-webmcp-tool": "place_order",
          "x-webmcp-action": minted.token,
          cookie: userCookie(),
        },
      }),
      { secret: SECRET },
      ["orders:write"],
      { nonceStore: createMemoryNonceStore() }
    );

    expect(result).toMatchObject({ allowed: true, actor: "agent" });
  });

  it("reports an anonymous caller", async () => {
    const result = await authorizeWebMCPRequest(
      new Request("https://app.test/api/orders"),
      { secret: SECRET }
    );

    expect(result).toMatchObject({ allowed: false, actor: "anonymous" });
  });
});

describe("createWebMCPHandler", () => {
  const handler = createWebMCPHandler(config, {
    basePath: "/api/auth",
    allowedScopes: ["orders:read"],
  });

  it("ignores paths it does not own", async () => {
    expect(
      await handler(new Request("https://app.test/api/auth/session"))
    ).toBeNull();
  });

  it("serves the manifest", async () => {
    const response = await handler(
      new Request("https://app.test/api/auth/webmcp/manifest")
    );

    const body = (await response?.json()) as { allowedScopes: string[] };
    expect(body.allowedScopes).toEqual(["orders:read"]);
  });

  it("routes grant requests", async () => {
    const response = await handler(
      post(
        "https://app.test/api/auth/webmcp/grant",
        { scopes: ["orders:read"] },
        { cookie: userCookie() }
      )
    );

    expect(response?.status).toBe(200);
  });
});
