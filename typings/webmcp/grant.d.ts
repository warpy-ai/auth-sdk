import type { WebMCPGrantResponse } from "./types";
export interface WebMCPGrant {
    token: string;
    agentId: string;
    scopes: string[];
    expiresAt: number;
    issuedAt: number;
}
export type GrantListener = (grant: WebMCPGrant | null) => void;
export declare class GrantStore {
    private grant;
    private listeners;
    get(): WebMCPGrant | null;
    set(grant: WebMCPGrant): void;
    clear(): void;
    has(scopes: string[]): boolean;
    missing(scopes: string[]): string[];
    subscribe(listener: GrantListener): () => void;
    private emit;
}
export declare function toGrant(response: WebMCPGrantResponse, fallbackScopes: string[]): WebMCPGrant;
