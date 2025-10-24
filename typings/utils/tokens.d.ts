export declare function generateSecureToken(length?: number): string;
export declare function createMagicToken(email: string, userId?: string, expiresInMs?: number): string;
export declare function verifyMagicToken(token: string): {
    email: string;
    userId?: string;
} | null;
export declare function cleanExpiredMagicTokens(): void;
