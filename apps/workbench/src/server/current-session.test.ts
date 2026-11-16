import { getDatabasePool } from "@/server/database";
import { SessionExpiredError } from "@repo/application/errors";
import { authenticateSession } from "@repo/application/services/authentication";
import { headers } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "./current-session";

vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@repo/application/services/authentication", () => ({
  authenticateSession: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

const sessionId = "00000000-0000-4000-8000-000000000001";
const context = { sessionId, userId: "00000000-0000-4000-8000-000000000002" };

function request(cookie: string): Request {
  return new Request("http://localhost:3000", { headers: { cookie } });
}

describe("current session lookup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATABASE_URL", "postgres://localhost/example");
    vi.stubEnv("SESSION_COOKIE_NAME", "custom_session");
    vi.mocked(authenticateSession).mockResolvedValue(context);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("authenticates the configured cookie from a request", async () => {
    expect(await getCurrentSession(request(`custom_session=${sessionId}`))).toEqual(context);
    expect(authenticateSession).toHaveBeenCalledWith(getDatabasePool(), sessionId);
    expect(headers).not.toHaveBeenCalled();
  });

  it("authenticates the current server request using its raw cookie header", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({
      cookie: `other=value; custom_session=${sessionId}`,
    }));
    expect(await getCurrentSession()).toEqual(context);
    expect(authenticateSession).toHaveBeenCalledWith(getDatabasePool(), sessionId);
  });

  it("uses the default cookie name when no name is configured", async () => {
    vi.stubEnv("SESSION_COOKIE_NAME", undefined);
    expect(await getCurrentSession(request(`dso_session=${sessionId}`))).toEqual(context);
  });

  it.each([
    "",
    "custom_session=",
    "another_session=value",
    `custom_session=${sessionId}; custom_session=other`,
  ])("returns null for absent, empty, or duplicate cookies: %s", async (cookie) => {
    expect(await getCurrentSession(request(cookie))).toBeNull();
    expect(authenticateSession).not.toHaveBeenCalled();
    expect(getDatabasePool).not.toHaveBeenCalled();
  });

  it("also rejects duplicate cookies in server request headers", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({
      cookie: `custom_session=${sessionId}; custom_session=other`,
    }));
    expect(await getCurrentSession()).toBeNull();
    expect(authenticateSession).not.toHaveBeenCalled();
  });

  it("returns null for invalid or expired sessions", async () => {
    vi.mocked(authenticateSession).mockRejectedValue(new SessionExpiredError());
    expect(await getCurrentSession(request("custom_session=invalid"))).toBeNull();
  });

  it("propagates unexpected errors instead of treating them as unauthenticated", async () => {
    const error = new Error("database unavailable");
    vi.mocked(authenticateSession).mockRejectedValue(error);
    await expect(getCurrentSession(request(`custom_session=${sessionId}`))).rejects.toBe(error);
  });

  it("propagates server request header failures", async () => {
    const error = new Error("headers unavailable");
    vi.mocked(headers).mockRejectedValue(error);
    await expect(getCurrentSession()).rejects.toBe(error);
  });
});
