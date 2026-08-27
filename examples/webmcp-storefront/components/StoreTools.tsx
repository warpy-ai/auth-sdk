"use client";
import { useRouter } from "next/navigation";
import { useWebMCPTool } from "@warpy-auth-sdk/core/webmcp/react";
import { PRICING } from "@/lib/pricing";

/**
 * The shop's tools.
 *
 * Each one is an ordinary async function plus a declaration of what it needs:
 * which scopes, whether it changes anything, what it costs. The SDK turns that
 * into the gates — nothing here checks a session, a scope, a rate limit or a
 * payment, because none of it is this component's job.
 */
export function StoreTools() {
  const router = useRouter();

  useWebMCPTool({
    name: "search_products",
    description:
      "Search the coffee shop's public catalogue by keyword. Free. Returns name, price, stock and id for each match.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look for." },
        limit: { type: "number", description: "Maximum results (default 10)." },
      },
      required: ["query"],
    },
    async execute({ query, limit }, ctx) {
      const params = new URLSearchParams({ q: String(query ?? "") });
      if (limit) params.set("limit", String(limit));
      const response = await ctx.fetch(`/api/search?${params}`);
      return response.json();
    },
  });

  useWebMCPTool({
    name: "premium_search",
    description:
      "Search the FULL catalogue, including unlisted allocations that never appear on any page, matched on intent rather than exact keywords. Use this when the shopper wants something rare, or when search_products found nothing good.",
    annotations: { readOnlyHint: true },
    // Priced. The first two calls are free so an agent can find out whether it
    // is worth paying for.
    price: PRICING.premium_search,
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'What the shopper is after, in their own words, e.g. "something rare for a gift".',
        },
      },
      required: ["query"],
    },
    async execute({ query }, ctx) {
      const response = await ctx.fetch(
        `/api/search/premium?q=${encodeURIComponent(String(query ?? ""))}`
      );
      if (!response.ok) {
        return { error: `Search failed with ${response.status}` };
      }
      return response.json();
    },
  });

  useWebMCPTool({
    name: "view_cart",
    description: "Read the shopper's current cart: lines, quantities and total.",
    annotations: { readOnlyHint: true },
    scopes: ["catalog:read"],
    inputSchema: { type: "object", properties: {} },
    async execute(_args, ctx) {
      const response = await ctx.fetch("/api/cart");
      return response.json();
    },
  });

  useWebMCPTool({
    name: "add_to_cart",
    description:
      "Add a product to the shopper's cart by id. Ids come from search_products or premium_search.",
    annotations: { destructiveHint: false },
    scopes: ["cart:write"],
    confirmMessage: ({ productId, quantity }) =>
      `Add ${quantity ?? 1} × ${productId} to your cart?`,
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product id." },
        quantity: { type: "number", description: "How many (default 1)." },
      },
      required: ["productId"],
    },
    async execute({ productId, quantity }, ctx) {
      const response = await ctx.fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: quantity ?? 1 }),
      });

      const body = await response.json();
      if (!response.ok) return { error: body.error };

      router.refresh();
      return body;
    },
  });

  useWebMCPTool({
    name: "remove_from_cart",
    description: "Remove a product from the shopper's cart by id.",
    annotations: { destructiveHint: false },
    scopes: ["cart:write"],
    inputSchema: {
      type: "object",
      properties: { productId: { type: "string" } },
      required: ["productId"],
    },
    async execute({ productId }, ctx) {
      const response = await ctx.fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, remove: true }),
      });
      router.refresh();
      return response.json();
    },
  });

  useWebMCPTool({
    name: "place_order",
    description:
      "Place an order for everything currently in the cart. This spends the shopper's money and cannot be undone.",
    // Irreversible and it spends money, so the person is always asked, with the
    // cart total in front of them.
    annotations: { destructiveHint: true },
    scopes: ["orders:write"],
    confirm: "always",
    confirmMessage: () =>
      "Place an order for everything in your cart? This cannot be undone.",
    inputSchema: { type: "object", properties: {} },
    async execute(_args, ctx) {
      const response = await ctx.fetch("/api/checkout", { method: "POST" });
      const body = await response.json();
      if (!response.ok) return { error: body.error };

      router.refresh();
      return body;
    },
  });

  useWebMCPTool({
    name: "list_orders",
    description: "List the shopper's past orders, newest first.",
    annotations: { readOnlyHint: true },
    scopes: ["orders:read"],
    inputSchema: { type: "object", properties: {} },
    async execute(_args, ctx) {
      const response = await ctx.fetch("/api/orders");
      return response.json();
    },
  });

  return null;
}
