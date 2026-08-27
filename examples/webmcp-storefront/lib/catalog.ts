/**
 * The shop's data. In-memory so the demo runs with no database: restart and it
 * resets. Everything an agent can reach goes through this module, so what the
 * agent sees and what the page renders can never drift apart.
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "USD";
  category: string;
  stock: number;
  /** Only reachable through the paid search tool. */
  unlisted?: boolean;
  tags: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: "kettle-01",
    name: "Pour-over kettle",
    description:
      "Gooseneck spout, 1L, brushed steel. Slow, controllable pour for filter coffee.",
    price: 68,
    currency: "USD",
    category: "brewing",
    stock: 12,
    tags: ["coffee", "kettle", "pour over", "gift"],
  },
  {
    id: "grinder-01",
    name: "Hand grinder",
    description:
      "Conical burr, 40 clicks of adjustment. Travels well, no batteries.",
    price: 94,
    currency: "USD",
    category: "brewing",
    stock: 5,
    tags: ["coffee", "grinder", "travel", "gift"],
  },
  {
    id: "scale-01",
    name: "Brew scale",
    description: "0.1g resolution with a built-in timer. Rechargeable.",
    price: 42,
    currency: "USD",
    category: "brewing",
    stock: 0,
    tags: ["coffee", "scale", "timer"],
  },
  {
    id: "beans-ethiopia",
    name: "Ethiopia Guji, 250g",
    description:
      "Washed, floral and citric. Roasted for filter. Ships within a day of roasting.",
    price: 19,
    currency: "USD",
    category: "coffee",
    stock: 40,
    tags: ["beans", "light roast", "filter", "fruity"],
  },
  {
    id: "beans-colombia",
    name: "Colombia Huila, 250g",
    description: "Washed, caramel and red apple. Forgiving in most brewers.",
    price: 16,
    currency: "USD",
    category: "coffee",
    stock: 60,
    tags: ["beans", "medium roast", "chocolate", "everyday"],
  },
  {
    id: "beans-decaf",
    name: "Decaf Brazil, 250g",
    description: "Sugarcane decaf. Heavy body, cocoa, low acidity.",
    price: 17,
    currency: "USD",
    category: "coffee",
    stock: 25,
    tags: ["beans", "decaf", "evening"],
  },
  {
    id: "cup-01",
    name: "Tasting cup, pair",
    description: "Wide-mouthed porcelain, 180ml. Made to show off aromatics.",
    price: 28,
    currency: "USD",
    category: "serving",
    stock: 18,
    tags: ["cup", "porcelain", "gift"],
  },
  // Unlisted stock: not on any page, reachable only through the paid tool. This
  // is what makes the paywall demo honest — the agent is buying access to
  // something it genuinely cannot get for free.
  {
    id: "lot-gesha-01",
    name: "Panama Gesha, micro-lot, 100g",
    description:
      "Auction lot, 22 bags total. Jasmine and bergamot. Allocated to subscribers first.",
    price: 145,
    currency: "USD",
    category: "coffee",
    stock: 3,
    unlisted: true,
    tags: ["beans", "rare", "auction", "gesha", "allocation"],
  },
  {
    id: "lot-yirg-01",
    name: "Yirgacheffe experimental anaerobic, 100g",
    description:
      "72-hour anaerobic ferment. Strawberry, cream soda. Nine bags left.",
    price: 88,
    currency: "USD",
    category: "coffee",
    stock: 9,
    unlisted: true,
    tags: ["beans", "rare", "experimental", "anaerobic"],
  },
];

export function listProducts(): Product[] {
  return PRODUCTS.filter((product) => !product.unlisted);
}

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

/** Plain keyword search over the public catalogue. */
export function searchProducts(query: string, limit = 10): Product[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return listProducts().slice(0, limit);

  return listProducts()
    .map((product) => ({ product, score: scoreProduct(product, needle) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

/**
 * The paid search: the whole catalogue, unlisted allocations included, matched
 * on intent words rather than exact terms.
 */
export function searchAllProducts(query: string, limit = 10): Product[] {
  const needle = query.trim().toLowerCase();
  const words = needle.split(/\s+/).filter(Boolean);

  return PRODUCTS.map((product) => {
    const direct = scoreProduct(product, needle);
    const expanded = words.reduce(
      (total, word) => total + scoreProduct(product, word) * 0.5,
      0
    );
    const intent = INTENT.reduce(
      (total, rule) =>
        rule.match.some((term) => needle.includes(term)) &&
        rule.tags.some((tag) => product.tags.includes(tag))
          ? total + 3
          : total,
      0
    );
    return { product, score: direct + expanded + intent };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

/** Intent words a keyword search would miss, which is the point of paying. */
const INTENT: Array<{ match: string[]; tags: string[] }> = [
  {
    match: ["rare", "special", "unusual", "allocation", "hard to find"],
    tags: ["rare", "auction"],
  },
  { match: ["gift", "present", "birthday"], tags: ["gift"] },
  { match: ["evening", "night", "sleep", "caffeine"], tags: ["decaf", "evening"] },
  { match: ["fruity", "floral", "bright", "acidic"], tags: ["fruity", "light roast"] },
  {
    match: ["chocolate", "nutty", "smooth", "everyday"],
    tags: ["chocolate", "everyday"],
  },
  { match: ["travel", "camping", "portable"], tags: ["travel"] },
];

function scoreProduct(product: Product, needle: string): number {
  if (!needle) return 0;
  let score = 0;
  if (product.name.toLowerCase().includes(needle)) score += 5;
  if (product.description.toLowerCase().includes(needle)) score += 2;
  for (const tag of product.tags) {
    if (tag.includes(needle) || needle.includes(tag)) score += 3;
  }
  if (product.category.includes(needle)) score += 2;
  return score;
}

export function money(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount
  );
}
