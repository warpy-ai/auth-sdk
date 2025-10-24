import { createMCPTools } from "@auth-sdk/core";

export async function POST(request: Request) {
  const secret = process.env.AUTH_SECRET!;
  const tools = createMCPTools({ secret });
  const body = await request.json().catch(() => ({}) as any);
  const { tool, args } = body || {};

  if (!tool || !(tool in tools)) {
    return Response.json({ error: "Unknown tool" }, { status: 400 });
  }

  // @ts-ignore
  const result = await tools[tool].execute(args || {});
  return Response.json(result, { status: 200 });
}
