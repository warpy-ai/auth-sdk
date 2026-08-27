"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWebMCP } from "@warpy-auth-sdk/core/webmcp/react";
import { useSession } from "./session";

const LINKS = [
  { href: "/", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
  { href: "/account", label: "Account" },
  { href: "/agent", label: "Agent" },
];

export function Header() {
  const pathname = usePathname();
  const { supported, tools, grantedScopes } = useWebMCP();
  const { session } = useSession();

  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Warpy<span className="text-[var(--accent)]">Coffee</span>
        </Link>

        <nav className="flex gap-1 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1"
              style={{
                background: pathname === link.href ? "#1c1c22" : "transparent",
                color:
                  pathname === link.href ? "var(--text)" : "var(--muted)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-xs muted">
          <span title={supported ? "document.modelContext is available" : "No WebMCP in this browser; tools are on the window.__webmcp__ bridge"}>
            <span
              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ background: supported ? "#7bc47f" : "#9b9ba5" }}
            />
            {tools.length} agent tools
          </span>
          {grantedScopes.length > 0 && (
            <span className="tag" style={{ color: "var(--accent)" }}>
              {grantedScopes.length} scopes delegated
            </span>
          )}
          <span>{session ? session.user.email : "signed out"}</span>
        </div>
      </div>
    </header>
  );
}
