import { Form, Link } from "@remix-run/react";
import { getSession } from "@warpy-auth-sdk/core/adapters/remix";
import { authConfig } from "~/lib/auth";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // If already logged in, redirect to dashboard
  const session = await getSession(request, authConfig);
  if (session) {
    return redirect("/dashboard");
  }
  return null;
}

export default function Login() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      <h1>Login</h1>
      <p>Sign in with your Google account:</p>
      <a
        href="/auth/signin/google"
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          backgroundColor: "#4285f4",
          color: "white",
          textDecoration: "none",
          borderRadius: "4px",
          marginTop: "1rem",
        }}
      >
        Sign in with Google
      </a>
      <div style={{ marginTop: "2rem" }}>
        <Link to="/">← Back to Home</Link>
      </div>
    </div>
  );
}
