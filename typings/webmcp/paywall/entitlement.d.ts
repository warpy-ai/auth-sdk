import type { PaymentReceipt } from "./types";
export type EntitlementListener = (receipts: PaymentReceipt[]) => void;
export declare class EntitlementStore {
    private receipts;
    private listeners;
    get(tool: string): PaymentReceipt | null;
    has(tool: string): boolean;
    set(receipt: PaymentReceipt): void;
    consume(tool: string): boolean;
    clear(tool?: string): void;
    list(): PaymentReceipt[];
    subscribe(listener: EntitlementListener): () => void;
    private emit;
}
