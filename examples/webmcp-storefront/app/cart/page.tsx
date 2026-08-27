"use client";
import { useCallback, useEffect, useState } from "react";
import { money } from "@/lib/catalog";

interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export default function Cart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/cart");
    if (!response.ok) {
      setError("Sign in to see your cart.");
      return;
    }
    const data = await response.json();
    setLines(data.cart.lines);
    setTotal(data.cart.total);
    setError(null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (productId: string) => {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, remove: true }),
    });
    load();
  };

  const placeOrder = async () => {
    setPlacing(true);
    const response = await fetch("/api/checkout", { method: "POST" });
    const data = await response.json();
    setPlacing(false);
    if (!response.ok) setError(data.error);
    else {
      setError(null);
      load();
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Cart</h1>
      {error && <p className="text-sm" style={{ color: "#e5735a" }}>{error}</p>}

      {lines.length === 0 && !error && <p className="text-sm muted">Empty.</p>}

      {lines.map((line) => (
        <div
          key={line.productId}
          className="panel flex items-center justify-between p-4"
        >
          <div>
            <p className="text-sm font-medium">{line.name}</p>
            <p className="text-xs muted">
              {line.quantity} × {money(line.price)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">{money(line.subtotal)}</span>
            <button className="btn" onClick={() => remove(line.productId)}>
              Remove
            </button>
          </div>
        </div>
      ))}

      {lines.length > 0 && (
        <div className="panel flex items-center justify-between p-4">
          <span className="text-sm font-semibold">Total {money(total)}</span>
          <button
            className="btn btn-primary"
            onClick={placeOrder}
            disabled={placing}
          >
            {placing ? "Placing…" : "Place order"}
          </button>
        </div>
      )}
    </div>
  );
}
