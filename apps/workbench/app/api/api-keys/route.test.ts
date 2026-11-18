import { getDatabasePool } from "@/server/database";
import { ProjectAccessDeniedError } from "@repo/application/errors";
import { authenticateSession } from "@repo/application/services/authentication";
import { createApiKey } from "@repo/application/services/api-keys";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@repo/application/services/authentication", () => ({
  authenticateSession: vi.fn(),
}));
vi.mock("@repo/application/services/api-keys", () => ({ createApiKey: vi.fn() }));

const origin = "http://localhost:3000";
const projectId = "00000000-0000-4000-8000-000000000001";
const sessionId = "00000000-0000-4000-8000-000000000002";
const context = {
  sessionId,
  userId: "00000000-0000-4000-8000-000000000003",
};
const payload = {
  projectId,
  expiresAt: "2099-01-01T00:00:00.000Z",
  scope: "release:read" as const,
};
const created = {
  apiKey: {
    id: "00000000-0000-4000-8000-000000000004",
    projectId,
    keyIdentifier: "0011223344556677",
    scope: "release:read" as const,
    expiresAt: payload.expiresAt,
  },
  credential: "dso_0011223344556677_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
};

function request(
  body = JSON.stringify(payload),
  headers: Record<string, string> = {},
): Request {
  return new Request(`${origin}/api/api-keys`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      "x-dso-csrf": "1",
      cookie: `dso_session=${sessionId}`,
      ...headers,
    },
    body,
  });
}

describe("POST /api/api-keys", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "postgres://localhost/example");
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
    vi.stubEnv("SESSION_COOKIE_NAME", "dso_session");
    vi.mocked(authenticateSession).mockResolvedValue(context);
    vi.mocked(createApiKey).mockResolvedValue(created);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("creates an API key for an authenticated admin and returns the credential once", async () => {
    const result = await POST(request());

    expect(result.status).toBe(201);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toEqual(created);
    expect(createApiKey).toHaveBeenCalledWith(getDatabasePool(), context, payload);
    expect(created).not.toHaveProperty("secret");
  });

  it.each(["production", "test", ""])(
    "is unavailable outside development: %s",
    async (environment) => {
      vi.stubEnv("NODE_ENV", environment);

      expect((await POST(request())).status).toBe(404);
      expect(getDatabasePool).not.toHaveBeenCalled();
    },
  );

  it.each(["missing-origin", "foreign-origin", "missing-header", "cross-site"])(
    "rejects CSRF violations before authentication: %s",
    async (kind) => {
      const incoming = request();
      if (kind === "missing-origin") incoming.headers.delete("origin");
      if (kind === "foreign-origin") incoming.headers.set("origin", "http://evil.test");
      if (kind === "missing-header") incoming.headers.delete("x-dso-csrf");
      if (kind === "cross-site") incoming.headers.set("sec-fetch-site", "cross-site");

      expect((await POST(incoming)).status).toBe(403);
      expect(authenticateSession).not.toHaveBeenCalled();
      expect(createApiKey).not.toHaveBeenCalled();
    },
  );

  it("requires JSON and a session", async () => {
    expect((await POST(request("{}", { "content-type": "text/plain" }))).status).toBe(
      415,
    );
    expect((await POST(request("{}", { cookie: "" }))).status).toBe(401);
    expect(createApiKey).not.toHaveBeenCalled();
  });

  it("rejects malformed, unknown-field, invalid-scope, and expired requests", async () => {
    const invalidBodies = [
      "{",
      JSON.stringify({ ...payload, extra: true }),
      JSON.stringify({ ...payload, scope: "write" }),
      JSON.stringify({ ...payload, expiresAt: "2020-01-01T00:00:00.000Z" }),
    ];

    for (const body of invalidBodies) {
      expect((await POST(request(body))).status).toBe(400);
    }
    expect(createApiKey).not.toHaveBeenCalled();
  });

  it("rejects oversized request bodies", async () => {
    const body = JSON.stringify(payload);
    const oversized = body + " ".repeat(CONTRACT_LIMITS.requestBodyBytes);

    expect((await POST(request(oversized))).status).toBe(413);
    expect(createApiKey).not.toHaveBeenCalled();
  });

  it.each(["editor", "publisher"])("maps a %s access denial to 403", async () => {
    vi.mocked(createApiKey).mockRejectedValue(new ProjectAccessDeniedError());

    const result = await POST(request());

    expect(result.status).toBe(403);
    expect(await result.json()).toMatchObject({
      error: { code: "project-access-denied" },
    });
  });

  it("maps unexpected creation failures safely", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createApiKey).mockRejectedValue(
      new Error(`database detail ${created.credential}`),
    );

    const result = await POST(request());
    const body = await result.json();

    expect(result.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain(created.credential);
  });
});
