import type { Session } from "../core";
import { getSession } from "../core";

export async function getServerSession(
  request: Request,
  secret: string
): Promise<Session | null> {
  return getSession(request, secret);
}
