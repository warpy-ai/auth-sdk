# Warpy Coffee — an agent-ready storefront

A small coffee shop that an AI agent can browse, search and order from, built on
[`@warpy-auth-sdk/core`](../../). It is a demo of three things that are hard to
get right when an agent is loose in a logged-in tab:

1. **The agent can actually use the site** — not by clicking pixels, but through
   tools the page publishes with [WebMCP](https://github.com/webmachinelearning/webmcp).
2. **It cannot exceed what the shopper agreed to** — scoped, expiring delegation,
   and a confirmation before anything irreversible.
3. **It pays for what costs money** — the premium search is priced per call, and
   an unpaid call gets a machine-readable challenge instead of a refusal.

## Run it

```bash
npm install
echo "AUTH_SECRET=$(openssl rand -hex 32)" > .env.local
npm run dev
```

Open http://localhost:3000, sign in on **Account**, then open **Agent** to watch
what happens.

WebMCP needs a secure context, so a real in-browser agent needs HTTPS or
`localhost`. The Agent page runs every tool by hand too, so the demo works in any
browser.

### Driving it with a real agent

- **ChatGPT desktop** — the built-in browser reads `document.modelContext`. Open
  the site there and ask it to shop. Use GPT-5.6 Sol or Terra; Luna has WebMCP
  turned off.
- **Chrome** — enable `chrome://flags/#enable-webmcp-testing` and use Gemini in
  Chrome.
- **Anything else** — the tools are published on `window.__webmcp__`, and the
  Agent page drives them directly.

Things worth asking an agent to do:

> Find me something rare for a coffee-obsessed friend, under $150, and add it to my cart.

That one exercises the whole demo: the free search finds nothing rare, the agent
falls back to the paid `premium_search`, discovers an unlisted auction lot, and
then has to ask for `cart:write` before it can act on what it found.

## What to look at

| Where | What it shows |
| --- | --- |
| **Shop** | The search form is annotated `toolname`/`tooldescription` — a tool with no JavaScript at all |
| **Agent** | Registered tools, delegated scopes, receipts, and a live audit log of every gate decision |
| **Account** | Card, CVV and password fields an agent can see but provably cannot read or fill |
| **Orders** | Orders an agent placed are labelled as such |

## How it is wired

The whole integration is three files.

**[`proxy.ts`](proxy.ts)** — one call to `authMiddleware` serves the session
routes, the WebMCP delegation routes and the paywall routes, and holds the
authoritative price list:

```ts
authMiddleware(authConfig, {
  basePath: "/api/auth",
  webmcp: {
    allowedScopes: ["catalog:read", "cart:write", "orders:read", "orders:write"],
    maxGrantSeconds: 900,
    paywall: { provider: paywallProvider(), pricing: PRICING },
  },
});
```

**[`components/StoreTools.tsx`](components/StoreTools.tsx)** — the shop's tools.
Each is a plain async function plus a declaration of what it needs. Nothing in
this file checks a session, a scope, a rate limit or a payment, because none of
that is its job:

```tsx
useWebMCPTool({
  name: "place_order",
  description: "Place an order for everything currently in the cart…",
  annotations: { destructiveHint: true },
  scopes: ["orders:write"],
  confirm: "always",
  async execute(_args, ctx) {
    const response = await ctx.fetch("/api/checkout", { method: "POST" });
    return response.json();
  },
});
```

**[`lib/guard.ts`](lib/guard.ts)** — one guard for every route an agent can
reach. A human with a session is allowed on the session alone; an agent must
also present a delegation covering the scopes the route names:

```ts
const access = await authorizeWebMCPRequest(request, { secret }, ["orders:write"]);
if (!access.allowed) return Response.json({ error: access.reason }, { status: 403 });
```

## The payment rail

The premium search costs 2 credits per call, with the first two free so an agent
can find out whether it is worth paying for.

By default the shop uses the SDK's **credits** provider — a prepaid balance on
the shopper's account, which needs no wallet. Every spend is confirmed with the
shopper, because it is their money.

Set `X402_PAY_TO` and `X402_ASSET` and the same tool switches to **x402**: the
agent pays per call from its own wallet, settled through a facilitator, with no
human in the loop. Nothing else in the app changes — see
[`proxy.ts`](proxy.ts#L20).

## What this demo does not prove

An agent running in the shopper's own tab holds their session. It can always do
what the shopper could do by clicking. The paywall here is a **billing
mechanism, not a security boundary** for that case — it charges cooperative
agents and locks out agents with no session at all. The consent and confirmation
gates are what protect the shopper, and they work because the agent asks the
person, not because the agent is prevented from asking.

The demo sign-in on the Account page is the one piece not to copy: it issues a
real SDK session without verifying anything, so the demo needs no mail server.
Use the SDK's magic link or an OAuth provider for anything real.

State is in memory. Restart and the shop resets.
