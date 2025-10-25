export declare function generateSecureToken(length?: number): string;
export declare function createMagicToken(email: string, userId?: string, expiresInMs?: number): string;
export declare function verifyMagicToken(token: string): {
    email: string;
    userId?: string;
} | null;
export declare function cleanExpiredMagicTokens(): void;
export declare function generateTwoFactorCode(): string;
export declare function createTwoFactorCode(email: string, userId?: string, expiresInMs?: number): {
    identifier: string;
    code: string;
};
export declare function verifyTwoFactorCode(identifier: string, code: string): {
    email: string;
    userId?: string;
} | null;
export declare function cleanExpiredTwoFactorCodes(): void;
