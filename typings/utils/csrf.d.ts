export declare function generateCSRFToken(sessionId?: string): string;
export declare function validateCSRFToken(sessionId: string, token: string): boolean;
export declare function cleanExpiredTokens(): void;
