import { listOrders } from "@/lib/store";
import { requireAccess } from "@/lib/guard";

export async function GET(request: Request) {
  const access = await requireAccess(request, ["orders:read"]);
  if (!access.ok) return access.response;

  return Response.json({ orders: listOrders(access.userId) });
}
