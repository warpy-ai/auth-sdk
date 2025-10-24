import { z } from "zod";
import type { Adapter } from "../adapters/types";
export interface MCPToolDefinition<T = unknown> {
    description: string;
    parameters: z.ZodObject<z.ZodRawShape>;
    execute: (args: T) => Promise<unknown>;
}
export declare function createMCPTools({ secret, adapter, }: {
    secret: string;
    adapter?: Adapter;
}): {
    agent_login: MCPToolDefinition;
    get_session: MCPToolDefinition;
    revoke_token: MCPToolDefinition;
};
export declare function isTokenRevoked(token: string): boolean;
