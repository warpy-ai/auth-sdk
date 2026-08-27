import { listProducts, findProduct } from "@/lib/catalog";

/** The public catalogue. No session needed: this is what anyone can browse. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");

  if (id) {
    const product = findProduct(id);
    if (!product || product.unlisted) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ product });
  }

  return Response.json({ products: listProducts() });
}
