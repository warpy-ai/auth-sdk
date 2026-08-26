export interface JWTPayload {
    userId: string;
    email?: string;
    name?: string;
    scopes?: string[];
    agentId?: string;
    type?: "standard" | "mcp-agent" | "webmcp-action";
    tool?: string;
    nonce?: string;
    origin?: string;
}
export declare function signJWT(payload: JWTPayload, secret: string, expiresIn?: string): string;
export declare function verifyJWT(token: string, secret: string): JWTPayload | null;
export declare function decodeJWT(token: string): JWTPayload | null;
