import type { WarpyConfig, WarpyShieldRequest, WarpyShieldResponse } from "./types";
export declare class WarpyError extends Error {
    status?: number;
    code?: string;
    constructor(message: string, status?: number, code?: string);
}
export declare class WarpyClient {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeoutMs;
    private readonly maxRetries;
    constructor(config: WarpyConfig);
    call<T = unknown>(req: WarpyShieldRequest): Promise<WarpyShieldResponse<T>>;
}
