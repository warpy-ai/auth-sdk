import { describe, it, expect } from "vitest";
import {
  registerAuthPlugin,
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
} from "../fastify";

// Minimal fake reply/request helpers
function createReply() {
  const headers: Record<string, string | string[]> = {};
  let status = 200;
  let redirected: string | null = null;
  let sent: unknown;
  const reply = {
    header(name: string, value: string | string[]) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    code(s: number) {
      status = s;
      return this;
    },
    redirect(url: string) {
      redirected = url;
      return this;
    },
    send(payload: unknown) {
      sent = payload;
      return this;
    },
    get state() {
      return { headers, status, redirected, sent };
    },
  } as any;
  return reply;
}

function createServer(): {
  app: FastifyInstance;
  routes: Record<string, (req: FastifyRequest, reply: FastifyReply) => unknown>;
} {
  const routes: Record<
    string,
    (req: FastifyRequest, reply: FastifyReply) => unknown
  > = {};
  const app: FastifyInstance = {
    get(
      path: string,
      handler: (req: FastifyRequest, reply: FastifyReply) => unknown
    ) {
      routes[`GET ${path}`] = handler;
    },
    post(
      path: string,
      handler: (req: FastifyRequest, reply: FastifyReply) => unknown
    ) {
      routes[`POST ${path}`] = handler;
    },
    decorateRequest() {},
  } as any;
  return { app, routes };
}

describe("fastify adapter", () => {
  const config: any = {
    secret: "test-secret-12345678901234567890123456789012",
    provider: { type: "custom" },
  };

  it("registers session and signout routes", async () => {
    const { app, routes } = createServer();
    registerAuthPlugin(app, config, { basePath: "/auth" });

    expect(routes["GET /auth/session"]).toBeTypeOf("function");
    expect(routes["POST /auth/signout"]).toBeTypeOf("function");
  });

  it("requireAuth returns 401 when no session", async () => {
    const { app } = createServer();
    const { requireAuth } = registerAuthPlugin(app, config, {
      basePath: "/auth",
    });

    const reply = createReply();
    await requireAuth(
      {
        method: "GET",
        url: "/x",
        headers: { host: "localhost" },
      } as any,
      reply as any
    );
    expect((reply as any).state.status).toBe(401);
  });
});
