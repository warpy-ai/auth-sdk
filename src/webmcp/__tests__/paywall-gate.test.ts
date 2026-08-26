import { describe, it, expect, vi } from "vitest";
import {
  PAYMENT_ARG,
  RateLimiter,
  guardTool,
  type GuardContext,
} from "../policy";
import { GrantStore } from "../grant";
import { EntitlementStore } from "../paywall/entitlement";
import { resolveEndpoints } from "../client";
import type {
  ToolResponse,
  WebMCPSession,
  WebMCPToolDefinition,
} from "../types";

const signedIn: WebMCPSession = {
  user: { id: "user-1", email: "a@b.co" },
  type: "standard",
};

const CHALLENGE = {
  provider: "x402",
  tool: "premium_search",
  price: { amount: "0.01", currency: "USDC" },
  chargesUser: false,
  instructions: "Pay 0.01 USDC then retry with _payment.",
  x402: {
    x402Version: 2,
    accepts: [
      {
        scheme: "exact",
        network: "base",
        amount: "10000",
        asset: "0xUSDC",
        payTo: "0xMerchant",
        maxTimeoutSeconds: 60,
      },
    ],
  },
};

function setup(
  options: {
    chargesUser?: boolean;
    approve?: boolean;
    entitled?: boolean;
    settleFails?: string;
  } = {}
) {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];

  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    calls.push({ url, body });

    if (url.endsWith("/paywall/quote")) {
      if (options.entitled) {
        return new Response(
          JSON.stringify({
            paid: true,
            receipt: {
              token: "receipt-token",
              calls: 2,
              expires: new Date(Date.now() + 60_000).toISOString(),
            },
          }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          paid: false,
          challenge: {
            ...CHALLENGE,
            chargesUser: options.chargesUser ?? false,
          },
        }),
        { status: 402 }
      );
    }

    if (url.endsWith("/paywall/settle")) {
      if (options.settleFails) {
        return new Response(
          JSON.stringify({
            paid: false,
            error: "payment_failed",
            message: options.settleFails,
          }),
          { status: 402 }
        );
      }
      return new Response(
        JSON.stringify({
          paid: true,
          receipt: {
            token: "receipt-token",
            calls: 1,
            expires: new Date(Date.now() + 60_000).toISOString(),
            transaction: "0xdeadbeef",
          },
        }),
        { status: 200 }
      );
    }

    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;

  const confirmHandler = vi.fn().mockResolvedValue(options.approve ?? true);
  const entitlements = new EntitlementStore();

  const context: GuardContext = {
    policy: { confirmHandler },
    endpoints: resolveEndpoints("/api/auth"),
    grants: new GrantStore(),
    getSession: async () => signedIn,
    rateLimiter: new RateLimiter({ limit: 30, windowMs: 60_000 }),
    entitlements,
    pricing: { premium_search: { amount: "0.01", currency: "USDC" } },
    fetchImpl,
  };

  const execute = vi.fn(async (_args: Record<string, unknown>, ctx) => {
    await ctx.fetch("/api/search");
    return { results: ["a", "b"] };
  });

  const tool: WebMCPToolDefinition = {
    name: "premium_search",
    description: "Search the premium index",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: { q: { type: "string" } } },
    execute,
  };

  const descriptor = guardTool(tool, context);
  const call = (args: Record<string, unknown> = {}) =>
    descriptor.execute(args) as Promise<ToolResponse>;

  return { descriptor, call, calls, execute, confirmHandler, entitlements };
}

function body(response: ToolResponse): Record<string, unknown> {
  return (response.structuredContent ?? {}) as Record<string, unknown>;
}

describe("paywall gate", () => {
  it("advertises the price in the tool description", () => {
    const { descriptor } = setup();
    expect(descriptor.description).toBe(
      "Search the premium index (costs 0.01 USDC per call)"
    );
  });

  it("adds a payment argument to the schema", () => {
    const { descriptor } = setup();
    expect(descriptor.inputSchema?.properties).toHaveProperty(PAYMENT_ARG);
    expect(descriptor.inputSchema?.properties).toHaveProperty("q");
  });

  it("returns a machine-readable challenge instead of running unpaid", async () => {
    const { call, execute } = setup();

    const result = await call({ q: "hats" });

    expect(result.isError).toBe(true);
    expect(body(result).error).toBe("payment_required");
    expect(body(result).x402).toMatchObject({ x402Version: 2 });
    expect(String(body(result).retry)).toContain(PAYMENT_ARG);
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not prompt the person for a call that cannot run yet", async () => {
    const { call, confirmHandler } = setup();
    await call({ q: "hats" });
    expect(confirmHandler).not.toHaveBeenCalled();
  });

  it("settles and runs when the agent retries with payment", async () => {
    const { call, calls, execute } = setup();

    await call({ q: "hats" });
    const result = await call({ q: "hats", [PAYMENT_ARG]: "base64payload" });

    expect(result.isError).toBeUndefined();
    expect(body(result)).toEqual({ results: ["a", "b"] });

    const settle = calls.find((entry) => entry.url.endsWith("/paywall/settle"));
    expect(settle?.body).toMatchObject({
      tool: "premium_search",
      payment: "base64payload",
    });
  });

  it("strips the payment argument before the tool sees it", async () => {
    const { call, execute } = setup();
    await call({ q: "hats", [PAYMENT_ARG]: "base64payload" });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0]?.[0]).toEqual({ q: "hats" });
  });

  it("sends the receipt to the API the tool calls", async () => {
    const { call, calls } = setup();
    await call({ [PAYMENT_ARG]: "base64payload" });

    const apiCall = calls.find((entry) => entry.url === "/api/search");
    expect(apiCall).toBeDefined();
  });

  it("does not ask the person to approve a call the agent pays for", async () => {
    const { call, confirmHandler } = setup({ chargesUser: false });
    await call({ [PAYMENT_ARG]: "base64payload" });
    expect(confirmHandler).not.toHaveBeenCalled();
  });

  it("always asks before spending the person's own money", async () => {
    const { call, confirmHandler } = setup({ chargesUser: true });

    await call({ [PAYMENT_ARG]: { accept: true } });

    expect(confirmHandler).toHaveBeenCalledTimes(1);
    const message = String(confirmHandler.mock.calls[0]?.[0]?.message);
    expect(message).toContain("0.01 USDC");
    expect(message).toContain("charged to your account");
  });

  it("does not settle when the person declines", async () => {
    const { call, calls, execute } = setup({
      chargesUser: true,
      approve: false,
    });

    const result = await call({ [PAYMENT_ARG]: { accept: true } });

    expect(body(result).error).toBe("declined_by_user");
    expect(calls.some((entry) => entry.url.endsWith("/paywall/settle"))).toBe(
      false
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it("reports a failed payment without running the tool", async () => {
    const { call, execute } = setup({ settleFails: "insufficient funds" });

    const result = await call({ [PAYMENT_ARG]: "bad" });

    expect(body(result)).toMatchObject({
      error: "payment_failed",
      message: "insufficient funds",
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it("skips payment when the caller is already entitled", async () => {
    const { call, calls, execute, confirmHandler } = setup({ entitled: true });

    const result = await call({ q: "hats" });

    expect(result.isError).toBeUndefined();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(confirmHandler).not.toHaveBeenCalled();
    expect(calls.some((entry) => entry.url.endsWith("/paywall/settle"))).toBe(
      false
    );
  });

  it("reuses a multi-call receipt without quoting again", async () => {
    const { call, calls } = setup({ entitled: true });

    await call({ q: "one" });
    await call({ q: "two" });

    const quotes = calls.filter((entry) =>
      entry.url.endsWith("/paywall/quote")
    );
    expect(quotes).toHaveLength(1);
  });

  it("re-quotes once the receipt is spent", async () => {
    const { call, calls } = setup({ entitled: true });

    await call({ q: "one" });
    await call({ q: "two" });
    await call({ q: "three" }); // receipt covered 2 calls

    const quotes = calls.filter((entry) =>
      entry.url.endsWith("/paywall/quote")
    );
    expect(quotes).toHaveLength(2);
  });

  it("redacts the payment payload from audit events", async () => {
    const events: Array<Record<string, unknown>> = [];
    const entitlements = new EntitlementStore();
    const descriptor = guardTool(
      {
        name: "free_tool",
        description: "no price",
        annotations: { readOnlyHint: true },
        execute: () => "ok",
      },
      {
        policy: { onAudit: (event) => events.push(event as never) },
        endpoints: resolveEndpoints(),
        grants: new GrantStore(),
        getSession: async () => signedIn,
        rateLimiter: new RateLimiter({ limit: 30, windowMs: 60_000 }),
        entitlements,
      }
    );

    await descriptor.execute({ [PAYMENT_ARG]: "signed-authorization" });

    const start = events.find((event) => event.phase === "start");
    expect((start?.args as Record<string, unknown>)[PAYMENT_ARG]).toBe(
      "[redacted]"
    );
  });

  it("refuses a priced tool when the page has no paywall wired up", async () => {
    const descriptor = guardTool(
      {
        name: "premium_search",
        description: "Search",
        annotations: { readOnlyHint: true },
        price: { amount: "0.01" },
        execute: () => "ok",
      },
      {
        policy: {},
        endpoints: resolveEndpoints(),
        grants: new GrantStore(),
        getSession: async () => signedIn,
        rateLimiter: new RateLimiter({ limit: 30, windowMs: 60_000 }),
      }
    );

    const result = (await descriptor.execute({})) as ToolResponse;
    expect(body(result).error).toBe("policy");
  });
});
