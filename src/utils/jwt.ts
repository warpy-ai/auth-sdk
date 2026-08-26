import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  email?: string;
  name?: string;
  scopes?: string[];
  agentId?: string;
  type?: "standard" | "mcp-agent" | "webmcp-action";
  /** WebMCP action tokens: the tool name the token authorizes. */
  tool?: string;
  /**
   * Unique id for this token. WebMCP action tokens use it for single-use
   * replay protection; delegations use it so two grants with identical claims
   * are still independently revocable.
   */
  nonce?: string;
  /** WebMCP action tokens: origin the action was initiated from. */
  origin?: string;
}

export function signJWT(
  payload: JWTPayload,
  secret: string,
  expiresIn: string = "7d"
): string {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

export function verifyJWT(token: string, secret: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (_error) {
    return null;
  }
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (_error) {
    return null;
  }
}
