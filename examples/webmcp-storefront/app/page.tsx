"use client";
import { useEffect, useState } from "react";
import { money, type Product } from "@/lib/catalog";
import { useSession } from "@/components/session";

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { session, refresh } = useSession();

  const load = async (q = "") => {
    const url = q ? `/api/search?q=${encodeURIComponent(q)}` : "/api/products";
    const data = await fetch(url).then((r) => r.json());
    setProducts(data.products ?? data.results ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (productId: string) => {
    setBusy(productId);
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    if (response.status === 401) alert("Sign in first — see the Account page.");
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <h1 className="text-lg font-semibold">A shop an agent can use</h1>
        <p className="mt-1 max-w-2xl text-sm muted">
          Everything on this page is also a tool. Ask ChatGPT or Gemini to find
          you something and add it to the cart — it will ask your permission
          before it touches your account, and pay for the search tools that cost
          money. Watch it happen on the{" "}
          <a href="/agent" className="text-[var(--accent)] underline">
            Agent
          </a>{" "}
          page.
        </p>
        {!session && (
          <p className="mt-3 text-sm" style={{ color: "var(--accent)" }}>
            You are signed out. Sign in on the Account page to let an agent do
            anything beyond browsing.
          </p>
        )}
      </section>

      {/* Annotated so a browser that speaks WebMCP can drive this form directly,
          without any JavaScript from us. */}
      <form
        toolname="search_catalogue"
        tooldescription="Search the public coffee catalogue by keyword"
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          load(query);
        }}
      >
        <input
          className="input"
          name="q"
          value={query}
          placeholder="Search the catalogue — beans, kettle, gift…"
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search products"
        />
        <button className="btn" type="submit">
          Search
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="panel flex flex-col p-4">
            <h2 className="text-sm font-semibold">{product.name}</h2>
            <p className="mt-1 flex-1 text-xs muted">{product.description}</p>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm">{money(product.price)}</span>
              <span className="tag">
                {product.stock > 0 ? `${product.stock} in stock` : "out of stock"}
              </span>
            </div>

            <button
              className="btn btn-primary mt-3"
              disabled={product.stock === 0 || busy === product.id}
              onClick={() => add(product.id)}
            >
              {busy === product.id ? "Adding…" : "Add to cart"}
            </button>
          </article>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-sm muted">
          Nothing matched. An agent with the paid <code>premium_search</code>{" "}
          tool can also see unlisted allocations that never appear here.
        </p>
      )}
    </div>
  );
}
