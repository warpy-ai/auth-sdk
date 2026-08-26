import { describe, it, expect, vi } from "vitest";
import {
  authorizePaidRequest,
  createMemoryUsageStore,
  creditsPaywall,
  describePricing,
  quotePaywall,
  settlePaywall,
  subscriptionPaywall,
  toAtomicUnits,
  verifyWebMCPPayment,
  x402Paywall,
} from "../paywall";
import { createWebMCPHandler } from "../server";
import { signJWT } from "../../utils/jwt";
import { SESSION_COOKIE_NAME } from "../../utils/cookie";
import type { AuthConfig } from "../../core";
import type { Provider } from "../../providers/types";
import type { PaywallOptions, PaywallQuoteResponse } from "../paywall";

const SECRET = "paywall-test-secret";
const config: AuthConfig = {
  secret: SECRET,
  provider: {} as Provider,
  mcp: { enabled: true },
};

const PRICE = { amount: "0.01", currency: "USDC" };

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://shop.test/api/auth/webmcp/paywall/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function userCookie(userId = "user-1") {
  return `${SESSION_COOKIE_NAME}=${signJWT({ userId, type: "standard" }, SECRET)}`;
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe("toAtomicUnits", () => {
  it("converts decimal prices without floating point error", () => {
    expect(toAtomicUnits("0.01", 6)).toBe("10000");
    expect(toAtomicUnits("1", 6)).toBe("1000000");
    expect(toAtomicUnits("0.000001", 6)).toBe("1");
    expect(toAtomicUnits("12.345678", 6)).toBe("12345678");
    expect(toAtomicUnits("0", 6)).toBe("0");
  });

  it("truncates beyond the asset's precision rather than rounding up", () => {
    expect(toAtomicUnits("0.0000019", 6)).toBe("1");
  });

  it("rejects a malformed amount", () => {
    expect(() => toAtomicUnits("abc", 6)).toThrow(/Invalid price/);
  });
});

describe("quote", () => {
  it("treats an unpriced tool as free", async () => {
    const response = await quotePaywall(
      post({ tool: "page_snapshot" }),
      SECRET,
      {},
      { pricing: { premium: PRICE } }
    );

    expect(await readJson<PaywallQuoteResponse>(response)).toEqual({
      paid: true,
    });
  });

  it("returns 402 with a challenge for an unpaid priced tool", async () => {
    const options: PaywallOptions = {
      pricing: { premium: PRICE },
      provider: x402Paywall({
        payTo: "0xMerchant",
        network: "base",
        asset: "0xUSDC",
      }),
    };

    const response = await quotePaywall(
      post({ tool: "premium" }),
      SECRET,
      {},
      options
    );
    const payload = await readJson<PaywallQuoteResponse>(response);

    expect(response.status).toBe(402);
    expect(payload.paid).toBe(false);
    expect(payload.challenge?.x402?.accepts[0]).toMatchObject({
      scheme: "exact",
      network: "base",
      amount: "10000",
      payTo: "0xMerchant",
    });
  });

  it("spends a free allowance before charging", async () => {
    const options: PaywallOptions = {
      pricing: { premium: { ...PRICE, freeCalls: 2 } },
      usageStore: createMemoryUsageStore(),
      provider: x402Paywall({
        payTo: "0xMerchant",
        network: "base",
        asset: "0xUSDC",
      }),
    };

    const quote = () =>
      quotePaywall(
        post({ tool: "premium" }, { cookie: userCookie() }),
        SECRET,
        { userId: "user-1" },
        options
      );

    expect((await quote()).status).toBe(200);
    expect((await quote()).status).toBe(200);
    expect((await quote()).status).toBe(402); // allowance spent
  });

  it("refuses to price a tool with no provider configured", async () => {
    const response = await quotePaywall(
      post({ tool: "premium" }),
      SECRET,
      {},
      { pricing: { premium: PRICE } }
    );

    expect(response.status).toBe(501);
  });
});

describe("x402 settlement", () => {
  function facilitator(overrides: { verify?: unknown; settle?: unknown } = {}) {
    const seen: Array<{ url: string; body: Record<string, unknown> }> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      seen.push({ url, body: JSON.parse(String(init?.body)) });
      const isVerify = url.endsWith("/verify");
      const payload = isVerify
        ? (overrides.verify ?? { isValid: true, payer: "0xAgent" })
        : (overrides.settle ?? {
            success: true,
            payer: "0xAgent",
            transaction: "0xabc",
            network: "base",
          });
      return new Response(JSON.stringify(payload), { status: 200 });
    }) as unknown as typeof fetch;

    return { fetchImpl, seen };
  }

  it("verifies then settles, and issues a receipt", async () => {
    const { fetchImpl, seen } = facilitator();
    const options: PaywallOptions = {
      pricing: { premium: PRICE },
      provider: x402Paywall({
        payTo: "0xMerchant",
        network: "base",
        asset: "0xUSDC",
        facilitatorUrl: "https://facilitator.test",
        fetchImpl,
      }),
    };

    const response = await settlePaywall(
      post({ tool: "premium", payment: { x402Version: 2, payload: {} } }),
      SECRET,
      {},
      options
    );

    const payload = await readJson<PaywallQuoteResponse>(response);

    expect(seen.map((entry) => entry.url)).toEqual([
      "https://facilitator.test/verify",
      "https://facilitator.test/settle",
    ]);
    expect(payload.paid).toBe(true);
    expect(payload.receipt?.transaction).toBe("0xabc");
    expect(payload.receipt?.payer).toBe("0xAgent");
  });

  it("does not settle a payment the facilitator rejects", async () => {
    const { fetchImpl, seen } = facilitator({
      verify: { isValid: false, invalidReason: "insufficient_funds" },
    });

    const response = await settlePaywall(
      post({ tool: "premium", payment: {} }),
      SECRET,
      {},
      {
        pricing: { premium: PRICE },
        provider: x402Paywall({
          payTo: "0xMerchant",
          network: "base",
          asset: "0xUSDC",
          facilitatorUrl: "https://facilitator.test",
          fetchImpl,
        }),
      }
    );

    expect(response.status).toBe(402);
    expect(seen.map((entry) => entry.url)).toEqual([
      "https://facilitator.test/verify",
    ]);
  });

  it("accepts a base64-encoded payment payload", async () => {
    const { fetchImpl, seen } = facilitator();
    const encoded = Buffer.from(
      JSON.stringify({ x402Version: 2, payload: { signature: "0xsig" } })
    ).toString("base64");

    await settlePaywall(
      post({ tool: "premium", payment: encoded }),
      SECRET,
      {},
      {
        pricing: { premium: PRICE },
        provider: x402Paywall({
          payTo: "0xMerchant",
          network: "base",
          asset: "0xUSDC",
          facilitatorUrl: "https://facilitator.test",
          fetchImpl,
        }),
      }
    );

    expect(seen[0]?.body.paymentPayload).toMatchObject({
      payload: { signature: "0xsig" },
    });
  });

  it("emits v1 field names when asked to speak v1", async () => {
    const provider = x402Paywall({
      payTo: "0xMerchant",
      network: "base",
      asset: "0xUSDC",
      version: 1,
    });

    const challenge = await provider.quote({
      tool: "premium",
      price: PRICE,
      resourceUrl: "https://shop.test/tool/premium",
      request: post({}),
    });

    expect(challenge.x402?.accepts[0]).toMatchObject({
      maxAmountRequired: "10000",
      resource: "https://shop.test/tool/premium",
    });
    expect(challenge.x402?.accepts[0]?.amount).toBeUndefined();
  });
});

describe("credits provider", () => {
  it("quotes against the balance and refuses an implicit charge", async () => {
    const charge = vi.fn().mockResolvedValue(true);
    const provider = creditsPaywall({
      getBalance: () => 5,
      charge,
      topUpUrl: "https://shop.test/billing",
    });

    const options: PaywallOptions = {
      pricing: { premium: { amount: "2" } },
      provider,
    };

    const quote = await readJson<PaywallQuoteResponse>(
      await quotePaywall(
        post({ tool: "premium" }),
        SECRET,
        { userId: "u" },
        options
      )
    );
    expect(quote.challenge?.chargesUser).toBe(true);
    expect(quote.challenge?.extra).toMatchObject({ balance: 5, cost: 2 });
    expect(charge).not.toHaveBeenCalled();

    // Without an explicit accept, nothing is deducted.
    const refused = await settlePaywall(
      post({ tool: "premium", payment: {} }),
      SECRET,
      { userId: "u" },
      options
    );
    expect(refused.status).toBe(402);
    expect(charge).not.toHaveBeenCalled();

    const accepted = await settlePaywall(
      post({ tool: "premium", payment: { accept: true } }),
      SECRET,
      { userId: "u" },
      options
    );
    expect(accepted.status).toBe(200);
    expect(charge).toHaveBeenCalledWith(expect.anything(), 2);
  });

  it("refuses when the balance will not cover the call", async () => {
    const charge = vi.fn();
    const response = await settlePaywall(
      post({ tool: "premium", payment: { accept: true } }),
      SECRET,
      { userId: "u" },
      {
        pricing: { premium: { amount: "10" } },
        provider: creditsPaywall({ getBalance: () => 1, charge }),
      }
    );

    expect(response.status).toBe(402);
    expect(charge).not.toHaveBeenCalled();
  });
});

describe("subscription provider", () => {
  it("issues a receipt without payment when the plan covers the tool", async () => {
    const response = await quotePaywall(
      post({ tool: "premium" }, { cookie: userCookie() }),
      SECRET,
      { userId: "user-1" },
      {
        pricing: { premium: PRICE },
        provider: subscriptionPaywall({
          entitled: () => true,
          callsPerCheck: 10,
        }),
      }
    );

    const payload = await readJson<PaywallQuoteResponse>(response);
    expect(payload.paid).toBe(true);
    expect(payload.receipt?.calls).toBe(10);
  });

  it("tells the agent to stop rather than to pay", async () => {
    const response = await quotePaywall(
      post({ tool: "premium" }),
      SECRET,
      {},
      {
        pricing: { premium: PRICE },
        provider: subscriptionPaywall({
          entitled: () => false,
          planName: "Pro",
          upgradeUrl: "https://shop.test/pro",
        }),
      }
    );

    const payload = await readJson<PaywallQuoteResponse>(response);
    expect(payload.challenge?.instructions).toContain("cannot subscribe");
    expect(payload.challenge?.extra).toMatchObject({ plan: "Pro" });
  });
});

describe("verifyWebMCPPayment", () => {
  async function receiptFor(tool: string, calls = 1): Promise<string> {
    const response = await quotePaywall(
      post({ tool }),
      SECRET,
      { userId: "user-1" },
      {
        pricing: { [tool]: { ...PRICE, freeCalls: calls } },
        usageStore: createMemoryUsageStore(),
      }
    );
    const payload = await readJson<PaywallQuoteResponse>(response);
    return payload.receipt?.token as string;
  }

  function request(token: string) {
    return new Request("https://shop.test/api/search", {
      headers: { "x-webmcp-receipt": token },
    });
  }

  it("accepts a valid receipt for the right tool", async () => {
    const token = await receiptFor("premium");
    const claims = await verifyWebMCPPayment(request(token), SECRET, {
      tool: "premium",
      usageStore: createMemoryUsageStore(),
    });

    expect(claims).toMatchObject({
      tool: "premium",
      userId: "user-1",
      calls: 1,
    });
  });

  it("rejects a receipt bought for a different tool", async () => {
    const token = await receiptFor("premium");
    const claims = await verifyWebMCPPayment(request(token), SECRET, {
      tool: "other_tool",
      usageStore: createMemoryUsageStore(),
    });

    expect(claims).toBeNull();
  });

  it("meters the receipt so one payment is not unlimited calls", async () => {
    const token = await receiptFor("premium");
    const usageStore = createMemoryUsageStore();

    expect(
      await verifyWebMCPPayment(request(token), SECRET, { usageStore })
    ).not.toBeNull();
    expect(
      await verifyWebMCPPayment(request(token), SECRET, { usageStore })
    ).toBeNull();
  });

  it("rejects a request with no receipt at all", async () => {
    const claims = await verifyWebMCPPayment(
      new Request("https://shop.test/api/search"),
      SECRET
    );
    expect(claims).toBeNull();
  });

  it("rejects a delegation token presented as a receipt", async () => {
    const agentToken = signJWT(
      { userId: "user-1", type: "mcp-agent", scopes: ["read"] },
      SECRET
    );

    const claims = await verifyWebMCPPayment(request(agentToken), SECRET, {
      usageStore: createMemoryUsageStore(),
    });
    expect(claims).toBeNull();
  });
});

describe("handler routing", () => {
  const handler = createWebMCPHandler(config, {
    basePath: "/api/auth",
    allowedScopes: ["premium"],
    paywall: {
      pricing: { premium: { amount: "0.01", currency: "USDC", calls: 5 } },
      provider: x402Paywall({
        payTo: "0xMerchant",
        network: "base",
        asset: "0xUSDC",
      }),
    },
  });

  it("advertises pricing in the manifest", async () => {
    const response = await handler(
      new Request("https://shop.test/api/auth/webmcp/manifest")
    );

    const payload = (await response?.json()) as {
      pricing: Array<Record<string, unknown>>;
      endpoints: Record<string, string>;
    };

    expect(payload.pricing).toEqual([
      { tool: "premium", amount: "0.01", currency: "USDC", calls: 5 },
    ]);
    expect(payload.endpoints.paywallQuote).toBe(
      "/api/auth/webmcp/paywall/quote"
    );
  });

  it("routes quote requests", async () => {
    const response = await handler(post({ tool: "premium" }));
    expect(response?.status).toBe(402);
  });
});

describe("describePricing", () => {
  it("fills in the defaults agents rely on", () => {
    expect(describePricing({ a: { amount: "1" } })).toEqual([
      { tool: "a", amount: "1", currency: "USD", calls: 1 },
    ]);
  });
});

describe("authorizePaidRequest", () => {
  async function paidRequest(tool = "premium"): Promise<Request> {
    const response = await quotePaywall(
      post({ tool }),
      SECRET,
      { userId: "user-1" },
      {
        pricing: { [tool]: { ...PRICE, freeCalls: 1 } },
        usageStore: createMemoryUsageStore(),
      }
    );
    const payload = await readJson<PaywallQuoteResponse>(response);

    return new Request("https://shop.test/api/search", {
      headers: {
        "x-webmcp-tool": tool,
        "x-webmcp-receipt": payload.receipt?.token as string,
      },
    });
  }

  it("lets a human session through without a receipt", async () => {
    const result = await authorizePaidRequest(
      new Request("https://shop.test/api/search", {
        headers: { cookie: userCookie() },
      }),
      SECRET
    );

    expect(result).toMatchObject({
      allowed: true,
      actor: "human",
      paid: false,
    });
  });

  it("charges a human too when asked to", async () => {
    const result = await authorizePaidRequest(
      new Request("https://shop.test/api/search", {
        headers: { cookie: userCookie() },
      }),
      SECRET,
      { chargeEveryone: true }
    );

    expect(result.allowed).toBe(false);
  });

  it("refuses an agent call with no receipt", async () => {
    const result = await authorizePaidRequest(
      new Request("https://shop.test/api/search", {
        headers: { "x-webmcp-tool": "premium" },
      }),
      SECRET
    );

    expect(result).toMatchObject({
      allowed: false,
      actor: "agent",
      paid: false,
    });
  });

  it("allows an agent call carrying a valid receipt", async () => {
    const result = await authorizePaidRequest(await paidRequest(), SECRET, {
      tool: "premium",
      usageStore: createMemoryUsageStore(),
    });

    expect(result).toMatchObject({ allowed: true, actor: "agent", paid: true });
    expect(result.claims?.tool).toBe("premium");
  });
});
