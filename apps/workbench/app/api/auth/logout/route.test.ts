import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { logout } from "@repo/application/services/authentication";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/server/config", () => ({
  securityEnvironment: {
    sessionCookieName: "custom_session",
    nodeEnv: "production",
    databaseUrl: "postgres://localhost/example",
  },
}));
vi.mock("@/server/current-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@repo/application/services/authentication", () => ({ logout: vi.fn() }));

const origin = "http://localhost:3000";
const sessionId = "00000000-0000-4000-8000-000000000001";
const context = { sessionId, userId: "00000000-0000-4000-8000-000000000002" };

function request(requestOrigin: string | null = origin): Request {
  const headers = new Headers();
  if (requestOrigin !== null) headers.set("origin", requestOrigin);
  headers.set("x-dso-csrf", "1");
  return new Request(`${origin}/api/auth/logout`, { method: "POST", headers });
}

describe("logout request boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
    vi.mocked(getCurrentSession).mockResolvedValue(context);
    vi.mocked(logout).mockResolvedValue(undefined);
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
      expect(getCurrentSession).not.toHaveBeenCalled();
      expect(getDatabasePool).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();
    },
  );

  it("deletes the session and expires the configured cookie", async () => {
    const incoming = request();
    const response = await POST(incoming);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true });
    expect(getCurrentSession).toHaveBeenCalledWith(incoming);
    expect(logout).toHaveBeenCalledWith(getDatabasePool(), context);
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("custom_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).not.toContain(sessionId);
  });

  it.each([null, "", "null", "http://evil.test"])(
    "rejects an untrusted origin before authentication: %s",
    async (badOrigin) => {
      const response = await POST(request(badOrigin));
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(getCurrentSession).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();
    },
  );

  it.each(["missing-header", "cross-site"] as const)(
    "rejects CSRF policy failure before logout: %s",
    async (failure) => {
      const incoming = request();
      if (failure === "missing-header") incoming.headers.delete("x-dso-csrf");
      else incoming.headers.set("sec-fetch-site", "cross-site");
      const response = await POST(incoming);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        ok: false,
        error: { code: "request-rejected", message: "The request was rejected." },
      });
      expect(getCurrentSession).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();
    },
  );

  it("rejects unauthenticated requests without deleting or clearing a session", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: "authentication-required", message: "Authentication is required." },
    });
    expect(getDatabasePool).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });

  it.each(["session lookup", "logout"] as const)(
    "does not clear the cookie or leak details if %s fails",
    async (stage) => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error(`sensitive database failure ${sessionId}`);
      if (stage === "session lookup") vi.mocked(getCurrentSession).mockRejectedValue(error);
      else vi.mocked(logout).mockRejectedValue(error);
      const response = await POST(request());
      expect(response.status).toBe(500);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(await response.text()).not.toContain(sessionId);
      expect(log).toHaveBeenCalledWith("Logout request failed.", { errorType: "Error" });
    },
  );

  it("fails closed when the trusted origin is not configured", async () => {
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", "");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(request())).status).toBe(500);
    expect(getCurrentSession).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
  });
});
