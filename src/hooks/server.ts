import type { Session } from "../core";
import { getSession } from "../core";

export function getServerSession(
  request: Request,
  secret: string
): Promise<Session | null> {
  return getSession(request, secret);
}
