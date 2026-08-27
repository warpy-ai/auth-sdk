import { searchProducts } from "@/lib/catalog";

/** Free keyword search over the public catalogue. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 10);

  return Response.json({
    query,
    results: searchProducts(query, Math.min(limit, 25)),
  });
}
