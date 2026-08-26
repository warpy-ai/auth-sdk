import type { PaymentReceipt } from "./types";

export type EntitlementListener = (receipts: PaymentReceipt[]) => void;

/**
 * Holds paid-up receipts for the current page, in memory only.
 *
 * Same reasoning as the delegation store: a receipt is a bearer credential for
 * money already spent, and one that outlives the tab is one nobody is watching.
 * Receipts are cheap to re-issue and short-lived by design.
 */
export class EntitlementStore {
  private receipts = new Map<string, PaymentReceipt>();
  private listeners = new Set<EntitlementListener>();

  /** Live receipt for a tool, or null when absent, expired or spent. */
  get(tool: string): PaymentReceipt | null {
    const receipt = this.receipts.get(tool);
    if (!receipt) return null;

    if (receipt.expiresAt <= Date.now() || receipt.calls <= 0) {
      this.receipts.delete(tool);
      this.emit();
      return null;
    }

    return receipt;
  }

  has(tool: string): boolean {
    return this.get(tool) !== null;
  }

  set(receipt: PaymentReceipt): void {
    this.receipts.set(receipt.tool, receipt);
    this.emit();
  }

  /**
   * Spends one call from a receipt.
   *
   * The page's count is a convenience so an agent is told it is out of calls
   * before making a doomed request; the server's usage store is what actually
   * enforces the limit.
   */
  consume(tool: string): boolean {
    const receipt = this.get(tool);
    if (!receipt) return false;

    receipt.calls -= 1;
    if (receipt.calls <= 0) this.receipts.delete(tool);
    this.emit();
    return true;
  }

  clear(tool?: string): void {
    if (tool) this.receipts.delete(tool);
    else this.receipts.clear();
    this.emit();
  }

  /** Everything currently paid for, for display in your own UI. */
  list(): PaymentReceipt[] {
    const now = Date.now();
    return Array.from(this.receipts.values()).filter(
      (receipt) => receipt.expiresAt > now && receipt.calls > 0
    );
  }

  subscribe(listener: EntitlementListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snapshot = this.list();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (_error) {
        // A misbehaving listener must not break a paid call.
      }
    }
  }
}
