export interface JWTPayload {
    userId: string;
    email?: string;
    name?: string;
    scopes?: string[];
    agentId?: string;
    type?: 'standard' | 'mcp-agent';
}
export declare function signJWT(payload: JWTPayload, secret: string, expiresIn?: string): string;
export declare function verifyJWT(token: string, secret: string): JWTPayload | null;
export declare function decodeJWT(token: string): JWTPayload | null;
