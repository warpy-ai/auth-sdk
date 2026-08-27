import { findProduct, type Product } from "./catalog";

/**
 * Carts, orders and credit balances, per user, in memory.
 *
 * A real shop would put this in a database. What matters for the demo is that
 * agent-driven writes and human clicks land in exactly the same place, through
 * exactly the same functions.
 */

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  lines: Array<CartLine & { name: string; price: number }>;
  total: number;
  placedAt: string;
  /** Set when an agent placed the order on the person's behalf. */
  placedByAgent?: string;
  status: "confirmed" | "shipped";
}

interface Account {
  cart: CartLine[];
  orders: Order[];
  /** Prepaid credits the paid search spends. */
  credits: number;
}

const accounts = new Map<string, Account>();
let orderCounter = 1000;

function accountFor(userId: string): Account {
  let account = accounts.get(userId);
  if (!account) {
    // New shoppers start with a few credits so the paid search can be tried
    // without a top-up flow standing in the way of the demo.
    account = { cart: [], orders: [], credits: 25 };
    accounts.set(userId, account);
  }
  return account;
}

export function getCart(userId: string) {
  const account = accountFor(userId);
  const lines = account.cart
    .map((line) => {
      const product = findProduct(line.productId);
      if (!product) return null;
      return {
        ...line,
        name: product.name,
        price: product.price,
        subtotal: product.price * line.quantity,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.subtotal, 0),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}

export type CartResult =
  | { ok: true; cart: ReturnType<typeof getCart> }
  | { ok: false; error: string };

export function addToCart(
  userId: string,
  productId: string,
  quantity = 1
): CartResult {
  const product = findProduct(productId);
  if (!product) return { ok: false, error: `No product with id "${productId}".` };
  if (quantity < 1) return { ok: false, error: "Quantity must be at least 1." };

  const account = accountFor(userId);
  const existing = account.cart.find((line) => line.productId === productId);
  const wanted = (existing?.quantity ?? 0) + quantity;

  if (product.stock < wanted) {
    return {
      ok: false,
      error:
        product.stock === 0
          ? `"${product.name}" is out of stock.`
          : `Only ${product.stock} of "${product.name}" left; the cart would hold ${wanted}.`,
    };
  }

  if (existing) existing.quantity = wanted;
  else account.cart.push({ productId, quantity });

  return { ok: true, cart: getCart(userId) };
}

export function removeFromCart(userId: string, productId: string): CartResult {
  const account = accountFor(userId);
  account.cart = account.cart.filter((line) => line.productId !== productId);
  return { ok: true, cart: getCart(userId) };
}

export type CheckoutResult =
  | { ok: true; order: Order }
  | { ok: false; error: string };

export function checkout(userId: string, agentId?: string): CheckoutResult {
  const account = accountFor(userId);
  if (account.cart.length === 0) return { ok: false, error: "The cart is empty." };

  const cart = getCart(userId);
  orderCounter += 1;

  const order: Order = {
    id: `ord_${orderCounter}`,
    userId,
    lines: cart.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      name: line.name,
      price: line.price,
    })),
    total: cart.total,
    placedAt: new Date().toISOString(),
    ...(agentId ? { placedByAgent: agentId } : {}),
    status: "confirmed",
  };

  // Decrement stock so the catalogue an agent reads stays truthful.
  for (const line of order.lines) {
    const product = findProduct(line.productId) as Product;
    product.stock = Math.max(0, product.stock - line.quantity);
  }

  account.orders.unshift(order);
  account.cart = [];

  return { ok: true, order };
}

export function listOrders(userId: string): Order[] {
  return accountFor(userId).orders;
}

/* ------------------------------ credits ---------------------------------- */

export function getCredits(userId: string): number {
  return accountFor(userId).credits;
}

/**
 * Deducts credits atomically.
 *
 * "Atomic" is trivial here because the whole process is single-threaded and
 * synchronous — in a real deployment this has to be one database statement, or
 * two concurrent tool calls will both read the old balance.
 */
export function spendCredits(userId: string, amount: number): boolean {
  const account = accountFor(userId);
  if (account.credits < amount) return false;
  account.credits -= amount;
  return true;
}

export function addCredits(userId: string, amount: number): number {
  const account = accountFor(userId);
  account.credits += amount;
  return account.credits;
}
