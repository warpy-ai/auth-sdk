"use client";
import { useState } from "react";
import { useSession } from "@/components/session";

export default function Account() {
  const { session, refresh } = useSession();
  const [address, setAddress] = useState("shopper@example.com");
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    await fetch("/api/demo-signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: address }),
    });
    setBusy(false);
    refresh();
  };

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    refresh();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">Account</h1>

      <section className="panel p-5">
        {session ? (
          <>
            <p className="text-sm">
              Signed in as <strong>{session.user.email}</strong>
            </p>
            <button className="btn mt-3" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm muted">
              Demo sign-in. A real shop would use the SDK&apos;s magic link or an
              OAuth provider; this issues the same signed session those flows
              produce, so delegation, action tokens and receipts all behave
              exactly as they would in production.
            </p>
            <div className="flex gap-2">
              <input
                className="input"
                type="email"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                aria-label="Email"
              />
              <button
                className="btn btn-primary"
                onClick={signIn}
                disabled={busy}
              >
                {busy ? "…" : "Sign in"}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold">Payment details</h2>
        <p className="mt-1 text-xs muted">
          These fields exist to prove a point: an agent can see that they are
          here, and cannot read or fill any of them. Card and password fields are
          refused by type, and the block is marked{" "}
          <code>data-agent-sensitive</code>.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2" data-agent-sensitive>
          <label className="text-xs muted">
            Card number
            <input
              className="input mt-1"
              name="cardNumber"
              autoComplete="cc-number"
              defaultValue="4242 4242 4242 4242"
            />
          </label>
          <label className="text-xs muted">
            CVV
            <input
              className="input mt-1"
              name="cvv"
              autoComplete="cc-csc"
              defaultValue="123"
            />
          </label>
          <label className="text-xs muted">
            Account password
            <input
              className="input mt-1"
              type="password"
              name="password"
              defaultValue="hunter2"
            />
          </label>
          <label className="text-xs muted">
            Shipping address
            <input
              className="input mt-1"
              name="address"
              defaultValue="12 Roastery Lane"
            />
          </label>
        </div>
      </section>

      {/* Off-limits entirely: an agent never sees this subtree. */}
      <section className="panel p-5" data-agent-ignore>
        <h2 className="text-sm font-semibold">Danger zone</h2>
        <p className="mt-1 text-xs muted">
          Marked <code>data-agent-ignore</code>, so it does not appear in any
          snapshot and no reference to it can be resolved.
        </p>
        <button className="btn mt-3">Close account</button>
      </section>
    </div>
  );
}
