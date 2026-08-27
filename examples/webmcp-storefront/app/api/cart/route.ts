import { addToCart, getCart, removeFromCart } from "@/lib/store";
import { requireAccess } from "@/lib/guard";

export async function GET(request: Request) {
  const access = await requireAccess(request, ["catalog:read"]);
  if (!access.ok) return access.response;

  return Response.json({ cart: getCart(access.userId) });
}

export async function POST(request: Request) {
  // Writing to the cart is the first thing that needs delegated authority.
  const access = await requireAccess(request, ["cart:write"]);
  if (!access.ok) return access.response;

  const body = (await request.json().catch(() => ({}))) as {
    productId?: string;
    quantity?: number;
    remove?: boolean;
  };

  if (!body.productId) {
    return Response.json({ error: "productId is required" }, { status: 400 });
  }

  const result = body.remove
    ? removeFromCart(access.userId, body.productId)
    : addToCart(access.userId, body.productId, body.quantity ?? 1);

  if (!result.ok) return Response.json({ error: result.error }, { status: 409 });

  return Response.json({ cart: result.cart, actor: access.actor });
}
