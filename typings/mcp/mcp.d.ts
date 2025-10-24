import { z } from 'zod';
export interface MCPToolDefinition {
    description: string;
    parameters: z.ZodObject<any>;
    execute: (args: any) => Promise<any>;
}
export declare function createMCPTools({ secret, adapter }: {
    secret: string;
    adapter?: any;
}): {
    agent_login: MCPToolDefinition;
    get_session: MCPToolDefinition;
    revoke_token: MCPToolDefinition;
};
export declare function isTokenRevoked(token: string): boolean;
