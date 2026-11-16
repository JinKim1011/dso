import { getDatabasePool } from "@/server/database";
import { InvalidCredentialsError } from "@repo/application/errors";
import { login } from "@repo/application/services/authentication";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/server/config", () => ({
  securityEnvironment: {
    sessionCookieName: "custom_session",
    nodeEnv: "production",
    databaseUrl: "postgres://localhost/example",
  },
}));
vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@repo/application/services/authentication", () => ({ login: vi.fn() }));

const origin = "http://localhost:3000";
const sessionId = "00000000-0000-4000-8000-000000000001";
const loginResponse = {
  user: { id: "00000000-0000-4000-8000-000000000002", email: "user@example.test" },
  expiresAt: "2030-01-01T00:00:00.000Z",
};

function request(
  body = JSON.stringify({ email: "user@example.test", password: "password" }),
  headers: Record<string, string> = {},
) {
  return new Request(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body,
  });
}

describe("login request boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
    vi.mocked(login).mockResolvedValue({ response: loginResponse, sessionId });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(["production", "test", "", undefined])(
    "is unavailable outside development: %s",
    async (env) => {
      vi.stubEnv("NODE_ENV", env);
      const response = await POST(request());
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(await response.json()).toEqual({
        ok: false,
        error: { code: "not-found", message: "Not found." },
      });
      expect(getDatabasePool).not.toHaveBeenCalled();
      expect(login).not.toHaveBeenCalled();
    },
  );

  it("returns only the safe response and sets the configured secure session cookie", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(loginResponse);
    expect(login).toHaveBeenCalledWith(getDatabasePool(), {
      email: "user@example.test",
      password: "password",
    });
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain(`custom_session=${sessionId}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=28800");
  });

  it("rejects untrusted origins, non-JSON, malformed JSON, and invalid contracts", async () => {
    expect((await POST(request("{}", { origin: "http://evil.test" }))).status).toBe(403);
    expect((await POST(request("{}", { origin: "" }))).status).toBe(403);
    expect((await POST(request("{}", { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(request("{"))).status).toBe(400);
    const response = await POST(request(JSON.stringify({
      email: "bad",
      password: "password",
      extra: true,
    })));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "invalid-request",
        issues: expect.arrayContaining([
          expect.objectContaining({ field: "email" }),
          expect.objectContaining({ field: "extra" }),
        ]),
      },
    });
    expect(login).not.toHaveBeenCalled();
  });

  it("limits the request body before calling the service", async () => {
    const response = await POST(request(" ".repeat(CONTRACT_LIMITS.requestBodyBytes + 1)));
    expect(response.status).toBe(413);
    expect(login).not.toHaveBeenCalled();
  });

  it("returns generic invalid credentials without a cookie", async () => {
    vi.mocked(login).mockRejectedValue(new InvalidCredentialsError());
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: "invalid-credentials", message: "Invalid email or password." },
    });
  });

  it("logs unexpected failures without exposing their details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(login).mockRejectedValue(new Error("sensitive database error"));
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).not.toContain("sensitive database error");
    expect(log).toHaveBeenCalled();
  });
});
