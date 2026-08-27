import { describe, it, expect } from "vitest";
import { toPublicSession } from "../../core";
import { createNextAuthHandler } from "../../next/handler";
import { signJWT } from "../../utils/jwt";
import { SESSION_COOKIE_NAME } from "../../utils/cookie";
import type { AuthConfig, Session } from "../../core";
import type { Provider } from "../../providers/types";

const SECRET = "session-exposure-secret";

const config: AuthConfig = {
  secret: SECRET,
  provider: {} as Provider,
};

describe("toPublicSession", () => {
  it("removes the signed token and keeps everything else", () => {
    const session: Session = {
      user: { id: "u1", email: "a@b.co", name: "Ada" },
      expires: new Date("2030-01-01"),
      token: "signed.jwt.value",
      type: "standard",
      scopes: ["read"],
    };

    const published = toPublicSession(session);

    expect(published).not.toHaveProperty("token");
    expect(published).toMatchObject({
      user: { id: "u1", email: "a@b.co" },
      type: "standard",
      scopes: ["read"],
    });
  });
});

describe("the session endpoint", () => {
  /**
   * The session cookie is HttpOnly so page scripts cannot read it. An endpoint
   * that echoes the same JWT hands it to any script on the origin — including
   * an in-tab agent — and undoes that protection.
   */
  it("never returns the session token to the browser", async () => {
    const handler = createNextAuthHandler(config, { basePath: "/api/auth" });
    const token = signJWT(
      { userId: "u1", email: "a@b.co", type: "standard" },
      SECRET
    );

    const response = await handler(
      new Request("https://shop.test/api/auth/session", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      })
    );

    const body = await response.text();

    expect(body).not.toContain(token);
    expect(JSON.parse(body).session).toMatchObject({
      user: { id: "u1", email: "a@b.co" },
    });
    expect(JSON.parse(body).session).not.toHaveProperty("token");
  });

  it("still reports a signed-out visitor as null", async () => {
    const handler = createNextAuthHandler(config, { basePath: "/api/auth" });

    const response = await handler(
      new Request("https://shop.test/api/auth/session")
    );

    expect((await response.json()).session).toBeNull();
  });
});
