import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { createAuthHandlers } from "@warpy-auth-sdk/core/adapters/remix";
import { authConfig } from "~/lib/auth";

const { authLoader, authAction } = createAuthHandlers(authConfig, {
  basePath: "/auth",
  successRedirect: "/dashboard",
  errorRedirect: "/login",
});

/**
 * Handle GET requests (OAuth sign-in, callbacks, session)
 */
export async function loader(args: LoaderFunctionArgs) {
  const result = await authLoader(args);
  if (result !== null) {
    return result;
  }
  // If no auth route matched, return 404
  return new Response("Not Found", { status: 404 });
}

/**
 * Handle POST requests (sign-out, email sign-in, 2FA, etc.)
 */
export async function action(args: ActionFunctionArgs) {
  const result = await authAction(args);
  if (result !== null) {
    return result;
  }
  // If no auth route matched, return 404
  return new Response("Not Found", { status: 404 });
}
