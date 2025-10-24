import { type JWTPayload } from './utils/jwt';
import type { Provider } from './providers/types';
import type { Adapter } from './adapters/types';
export interface AuthConfig {
    provider: Provider;
    secret: string;
    adapter?: Adapter;
    mcp?: {
        enabled: boolean;
        scopes?: string[];
    };
    callbacks?: {
        session?: (session: Session) => Session | Promise<Session>;
        jwt?: (token: JWTPayload) => JWTPayload | Promise<JWTPayload>;
    };
}
export interface Session {
    user: {
        id: string;
        email: string;
        name?: string;
        picture?: string;
    };
    expires: Date;
    token?: string;
    type?: 'standard' | 'mcp-agent';
    scopes?: string[];
    agentId?: string;
}
export interface MCPLoginPayload {
    userId: string;
    scopes: string[];
    agentId: string;
    expiresIn: string;
}
export interface AuthenticateResult {
    session?: Session;
    error?: string;
    redirectUrl?: string;
}
export declare function authenticate(config: AuthConfig, request?: Request, payload?: MCPLoginPayload): Promise<AuthenticateResult>;
export declare function getSession(request: Request, secret: string): Promise<Session | null>;
export declare function signOut(request: Request, config: AuthConfig): Promise<void>;
export declare function createSessionCookie(session: Session): string;
export declare function clearSessionCookie(): string;
export declare function verifyAgentToken(request: Request, secret: string): Promise<Session | null>;
export { google } from './providers/google';
export { email } from './providers/email';
export type { Adapter } from './adapters/types';
export { createMCPTools } from './mcp/mcp';
