import { checkout } from "@/lib/store";
import { requireAccess } from "@/lib/guard";

/** Placing an order: the most consequential thing an agent can do here. */
export async function POST(request: Request) {
  const access = await requireAccess(request, ["orders:write"]);
  if (!access.ok) return access.response;

  const result = checkout(access.userId, access.agentId);
  if (!result.ok) return Response.json({ error: result.error }, { status: 409 });

  return Response.json({ order: result.order, actor: access.actor });
}
