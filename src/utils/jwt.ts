import * as jwt from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  email?: string;
  name?: string;
  scopes?: string[];
  agentId?: string;
  type?: "standard" | "mcp-agent";
}

export function signJWT(
  payload: JWTPayload,
  secret: string,
  expiresIn: string = "7d"
): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
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
