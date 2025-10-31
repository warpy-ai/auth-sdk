import { Form, useLoaderData } from "@remix-run/react";
import { requireAuth } from "@warpy-auth-sdk/core/adapters/remix";
import { authConfig } from "~/lib/auth";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // This will throw a redirect if not authenticated
  const session = await requireAuth(request, authConfig, {
    redirectTo: "/login",
  });

  return { session };
}

export default function Dashboard() {
  const { session } = useLoaderData<typeof loader>();

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      <h1>Dashboard</h1>
      <p>Welcome! You are authenticated.</p>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <h2>Session Information</h2>
        <pre
          style={{
            backgroundColor: "#fff",
            padding: "1rem",
            borderRadius: "4px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <Form method="post" action="/auth/signout" style={{ marginTop: "2rem" }}>
        <button
          type="submit"
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </Form>
    </div>
  );
}
