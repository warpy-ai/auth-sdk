import { authorizePaidRequest } from "@warpy-auth-sdk/core";
import { searchAllProducts } from "@/lib/catalog";
import { AUTH_SECRET } from "@/lib/auth";

/**
 * The paid search.
 *
 * `authorizePaidRequest` charges agent traffic and lets the shop's own human
 * sessions through — requiring a receipt from everyone would break every normal
 * page load of this route.
 */
export async function GET(request: Request) {
  const access = await authorizePaidRequest(request, AUTH_SECRET, {
    tool: "premium_search",
  });

  if (!access.allowed) {
    return Response.json({ error: access.reason }, { status: 402 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  return Response.json({
    query,
    paid: access.paid,
    results: searchAllProducts(query, 10),
  });
}
