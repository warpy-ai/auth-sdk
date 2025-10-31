import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix Auth Example</h1>
      <p>
        This is a simple example demonstrating authentication with{" "}
        <code>@warpy-auth-sdk/core</code> in a Remix application.
      </p>
      <nav style={{ marginTop: "2rem" }}>
        <Link
          to="/login"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            marginRight: "1rem",
            backgroundColor: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Login
        </Link>
        <Link
          to="/dashboard"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            backgroundColor: "#28a745",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Dashboard
        </Link>
      </nav>
    </div>
  );
}
