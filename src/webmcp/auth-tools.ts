import type {
  WebMCPEndpoints,
  WebMCPGrantResponse,
  WebMCPSession,
  WebMCPToolDefinition,
} from "./types";
import { ToolDenied } from "./policy";
import { toGrant, type GrantStore } from "./grant";

export interface AuthToolsOptions {
  endpoints: WebMCPEndpoints;
  grants: GrantStore;
  /** Identifier recorded on grants and audit events. */
  agentId?: string;
  /** Scopes this page is willing to delegate. Anything else is refused. */
  allowedScopes?: string[];
  /** Lifetime requested for a delegation. Default: "15m". */
  grantTtl?: string;
  /** OAuth providers offered by `auth_start_oauth`. */
  providers?: string[];
  /** Expose the email sign-in tool. Default: true. */
  signIn?: boolean;
  /** Expose the sign-out tool. Default: true. */
  signOut?: boolean;
  /**
   * Expose a tool that submits two-factor codes. Off by default: handing an
   * agent the ability to complete a second factor collapses it into the first.
   */
  twoFactor?: boolean;
}

/** Session view handed to the agent. The raw JWT never leaves the page. */
function publicSession(session: WebMCPSession | null) {
  if (!session) return { authenticated: false };
  return {
    authenticated: true,
    user: {
      id: session.user?.id,
      email: session.user?.email,
      name: session.user?.name,
    },
    type: session.type ?? "standard",
    scopes: session.scopes ?? [],
    ...(session.agentId ? { agentId: session.agentId } : {}),
    ...(session.expires ? { expires: session.expires } : {}),
  };
}

/**
 * The auth tools an agent needs to understand and extend its own authority —
 * and nothing more. Notably absent: anything that returns a session token,
 * password or one-time code to the model.
 */
export function createAuthTools(
  options: AuthToolsOptions
): WebMCPToolDefinition[] {
  const {
    endpoints,
    grants,
    agentId = "webmcp-agent",
    allowedScopes,
    grantTtl = "15m",
    providers = [],
  } = options;

  const tools: WebMCPToolDefinition[] = [];

  tools.push({
    name: "auth_get_session",
    description:
      "Get the signed-in user for this page: whether someone is authenticated, who they are, and which scopes the session carries. Never returns credentials.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
    execute: (_args, context) => publicSession(context.session),
  });

  tools.push({
    name: "auth_describe_access",
    description:
      "Describe what this agent is currently allowed to do: the scopes delegated to it, when the delegation expires, and which scopes can be requested with auth_request_access.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
    execute: () => {
      const grant = grants.get();
      return {
        granted: grant !== null,
        scopes: grant?.scopes ?? [],
        agentId: grant?.agentId ?? agentId,
        expiresAt: grant ? new Date(grant.expiresAt).toISOString() : undefined,
        requestableScopes: allowedScopes ?? "any scope the server allows",
      };
    },
  });

  tools.push({
    name: "auth_request_access",
    description:
      "Ask the signed-in person to delegate scoped, time-limited access to this agent. Required before any tool that declares scopes will run. The person is shown exactly which scopes are requested and must approve.",
    annotations: { destructiveHint: false },
    requireAuth: true,
    confirm: "always",
    confirmMessage: (args) => {
      const scopes = Array.isArray(args.scopes) ? args.scopes.join(", ") : "";
      const reason = typeof args.reason === "string" ? args.reason : "";
      return [
        "An AI agent is requesting delegated access to your account on this site.",
        "",
        `Scopes: ${scopes || "(none specified)"}`,
        reason ? `Reason given: ${reason}` : "",
        "",
        `This access expires automatically (${grantTtl}) and you can revoke it at any time.`,
        "",
        "Grant access?",
      ]
        .filter(Boolean)
        .join("\n");
    },
    inputSchema: {
      type: "object",
      properties: {
        scopes: {
          type: "array",
          items: { type: "string" },
          description: 'Scopes required, e.g. ["read", "orders:write"].',
          ...(allowedScopes ? { enum: allowedScopes } : {}),
        },
        reason: {
          type: "string",
          description:
            "Short explanation shown to the person of why the access is needed.",
        },
      },
      required: ["scopes"],
    },
    execute: async (args, context) => {
      const scopes = (Array.isArray(args.scopes) ? args.scopes : []).map(
        String
      );
      if (scopes.length === 0) {
        throw new ToolDenied(
          "invalid_arguments",
          "Specify at least one scope to request."
        );
      }

      if (allowedScopes) {
        const refused = scopes.filter(
          (scope) => !allowedScopes.includes(scope)
        );
        if (refused.length) {
          throw new ToolDenied(
            "policy",
            `This site does not delegate [${refused.join(", ")}]. Allowed scopes: ${allowedScopes.join(", ")}.`
          );
        }
      }

      const response = await context.fetch(endpoints.grant, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopes,
          agentId,
          expiresIn: grantTtl,
          reason: args.reason,
        }),
      });

      if (!response.ok) {
        throw new ToolDenied(
          "policy",
          `The server refused the delegation (${response.status}). ${await safeText(response)}`
        );
      }

      const payload = (await response.json()) as WebMCPGrantResponse;
      if (!payload?.token) {
        throw new ToolDenied(
          "policy",
          "The server did not return a delegation token."
        );
      }

      const grant = toGrant(payload, scopes);
      grants.set(grant);

      // The token stays in the page: the agent gets proof of the delegation,
      // not the bearer credential itself.
      return {
        granted: true,
        scopes: grant.scopes,
        agentId: grant.agentId,
        expiresAt: new Date(grant.expiresAt).toISOString(),
      };
    },
  });

  tools.push({
    name: "auth_revoke_access",
    description:
      "Give up the delegated access this agent holds, immediately and on the server. Call this when the task is finished.",
    annotations: { destructiveHint: false, idempotentHint: true },
    confirm: "never",
    inputSchema: { type: "object", properties: {} },
    execute: async (_args, context) => {
      const grant = grants.get();
      if (!grant) return { revoked: false, message: "No active delegation." };

      grants.clear();

      try {
        await context.fetch(endpoints.revoke, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: grant.token }),
        });
      } catch (_error) {
        // The local grant is already gone; the server copy expires on its own.
      }

      return { revoked: true, scopes: grant.scopes };
    },
  });

  if (options.signIn !== false) {
    tools.push({
      name: "auth_sign_in_email",
      description:
        "Send a magic sign-in link to an email address. The person must open the link themselves; this tool cannot complete the sign-in.",
      annotations: { destructiveHint: false, openWorldHint: true },
      confirm: "always",
      confirmMessage: (args) =>
        `An AI agent wants to send a sign-in link to ${String(args.email)}.\n\nAllow it?`,
      rateLimit: { limit: 3, windowMs: 10 * 60_000 },
      inputSchema: {
        type: "object",
        properties: {
          email: { type: "string", description: "Email address to send to." },
          captchaToken: {
            type: "string",
            description: "CAPTCHA token, when the site requires one.",
          },
        },
        required: ["email"],
      },
      execute: async (args, context) => {
        const email = String(args.email ?? "").trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new ToolDenied(
            "invalid_arguments",
            "A valid email is required."
          );
        }

        const response = await context.fetch(endpoints.signIn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            ...(args.captchaToken ? { captchaToken: args.captchaToken } : {}),
          }),
        });

        if (!response.ok) {
          throw new ToolDenied(
            "policy",
            `Sign-in request failed (${response.status}). ${await safeText(response)}`
          );
        }

        return {
          sent: true,
          email,
          message:
            "A sign-in link was emailed. Ask the person to open it; the agent cannot complete sign-in on their behalf.",
        };
      },
    });

    if (providers.length > 0) {
      tools.push({
        name: "auth_start_oauth",
        description:
          "Start an OAuth sign-in by navigating this tab to the provider. The person completes the sign-in themselves.",
        annotations: { destructiveHint: false },
        confirm: "always",
        confirmMessage: (args) =>
          `An AI agent wants to start ${String(args.provider)} sign-in.\n\nContinue?`,
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              description: "OAuth provider to use.",
              enum: providers,
            },
          },
          required: ["provider"],
        },
        execute: (args) => {
          const provider = String(args.provider ?? "");
          if (!providers.includes(provider)) {
            throw new ToolDenied(
              "invalid_arguments",
              `Unknown provider "${provider}". Available: ${providers.join(", ")}.`
            );
          }

          // The sign-in endpoint is "{base}/signin/{provider}"; swap the last
          // segment so a customized base path still resolves correctly.
          const url = endpoints.signIn.replace(/[^/]+$/, provider);
          const win = (globalThis as unknown as { window?: Window }).window;
          if (!win) {
            throw new ToolDenied("policy", "No browser window available.");
          }

          win.location.assign(url);
          return { startedOAuth: provider, url };
        },
      });
    }
  }

  if (options.twoFactor) {
    tools.push({
      name: "auth_verify_two_factor",
      description:
        "Submit a two-factor verification code the person has given you. Only use a code the person typed or dictated in this conversation.",
      annotations: { destructiveHint: false },
      confirm: "always",
      rateLimit: { limit: 5, windowMs: 10 * 60_000 },
      inputSchema: {
        type: "object",
        properties: {
          identifier: {
            type: "string",
            description: "Identifier returned when the code was sent.",
          },
          code: { type: "string", description: "The 6-digit code." },
        },
        required: ["identifier", "code"],
      },
      execute: async (args, context) => {
        const response = await context.fetch(endpoints.twoFactor, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: String(args.identifier ?? ""),
            code: String(args.code ?? ""),
          }),
        });

        if (!response.ok) {
          throw new ToolDenied(
            "policy",
            `Verification failed (${response.status}).`
          );
        }

        return { verified: true };
      },
    });
  }

  if (options.signOut !== false) {
    tools.push({
      name: "auth_sign_out",
      description: "Sign the person out of this site and drop any delegation.",
      annotations: { destructiveHint: true },
      confirm: "always",
      confirmMessage:
        "An AI agent wants to sign you out of this site.\n\nAllow it?",
      inputSchema: { type: "object", properties: {} },
      execute: async (_args, context) => {
        grants.clear();
        const response = await context.fetch(endpoints.signOut, {
          method: "POST",
        });
        return { signedOut: response.ok };
      },
    });
  }

  return tools;
}

async function safeText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 200);
  } catch (_error) {
    return "";
  }
}
