"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/catalog";

interface Order {
  id: string;
  total: number;
  placedAt: string;
  placedByAgent?: string;
  lines: Array<{ name: string; quantity: number }>;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders").then(async (response) => {
      if (!response.ok) return setError("Sign in to see your orders.");
      setOrders((await response.json()).orders);
    });
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Orders</h1>
      {error && <p className="text-sm muted">{error}</p>}
      {!error && orders.length === 0 && (
        <p className="text-sm muted">No orders yet.</p>
      )}

      {orders.map((order) => (
        <div key={order.id} className="panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{order.id}</span>
            <span className="text-sm">{money(order.total)}</span>
          </div>
          <p className="mt-1 text-xs muted">
            {new Date(order.placedAt).toLocaleString()}
            {order.placedByAgent && (
              // Orders an agent placed are labelled as such. The person should
              // always be able to tell which is which.
              <span className="ml-2 tag" style={{ color: "var(--accent)" }}>
                placed by agent {order.placedByAgent}
              </span>
            )}
          </p>
          <ul className="mt-2 text-xs muted">
            {order.lines.map((line) => (
              <li key={line.name}>
                {line.quantity} × {line.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
