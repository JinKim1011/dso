import { getDatabasePool } from "@/server/database";
import { RateLimitUnavailableError, checkRateLimit } from "@/server/rate-limit";
import {
  ProjectAccessDeniedError,
  ResourceNotFoundError,
} from "@repo/application/errors";
import { authenticateSession } from "@repo/application/services/authentication";
import { revokeApiKey } from "@repo/application/services/api-keys";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@/server/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/rate-limit")>();
  return { ...actual, checkRateLimit: vi.fn() };
});
vi.mock("@repo/application/services/authentication", () => ({
  authenticateSession: vi.fn(),
}));
vi.mock("@repo/application/services/api-keys", () => ({ revokeApiKey: vi.fn() }));

const origin = "http://localhost:3000";
const projectId = "00000000-0000-4000-8000-000000000001";
const apiKeyId = "00000000-0000-4000-8000-000000000002";
const sessionId = "00000000-0000-4000-8000-000000000003";
const context = {
  sessionId,
  userId: "00000000-0000-4000-8000-000000000004",
};
const revoked = {
  id: apiKeyId,
  projectId,
  keyIdentifier: "0011223344556677",
  keyHash: "must-not-be-returned",
  scope: "release:read" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z",
  revokedAt: "2026-01-02T00:00:00.000Z",
};

function request(
  body = JSON.stringify({ projectId }),
  headers: Record<string, string> = {},
): Request {
  return new Request(`${origin}/api/api-keys/${apiKeyId}/revoke`, {
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

function invoke(incoming = request(), id = apiKeyId) {
  return POST(incoming, { params: Promise.resolve({ apiKeyId: id }) });
}

describe("POST /api/api-keys/:apiKeyId/revoke", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "postgres://localhost/example");
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
    vi.stubEnv("SESSION_COOKIE_NAME", "dso_session");
    vi.mocked(authenticateSession).mockResolvedValue(context);
    vi.mocked(revokeApiKey).mockResolvedValue(revoked);
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      limit: 20,
      remaining: 19,
      resetAt: Date.now() + 600_000,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("revokes an API key for an authenticated admin and redacts its hash", async () => {
    const result = await invoke();
    const body = await result.json();

    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      ok: true,
      apiKey: {
        id: apiKeyId,
        projectId,
        keyIdentifier: revoked.keyIdentifier,
        scope: "release:read",
        expiresAt: revoked.expiresAt,
        revokedAt: revoked.revokedAt,
      },
    });
    expect(JSON.stringify(body)).not.toContain(revoked.keyHash);
    expect(revokeApiKey).toHaveBeenCalledWith(getDatabasePool(), context, {
      projectId,
      apiKeyId,
    });
  });

  it.each(["production", "test", ""])(
    "is unavailable outside development: %s",
    async (environment) => {
      vi.stubEnv("NODE_ENV", environment);

      expect((await invoke()).status).toBe(404);
      expect(getDatabasePool).not.toHaveBeenCalled();
    },
  );

  it("is available in production when API-key management is explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DSO_API_KEY_MANAGEMENT_ENABLED", "true");

    expect((await invoke()).status).toBe(200);
    expect(revokeApiKey).toHaveBeenCalled();
    expect(checkRateLimit).toHaveBeenCalledWith("api-key-revoke", [
      context.userId,
      projectId,
    ]);
  });

  it("returns 429 or 503 before API-key revocation", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DSO_API_KEY_MANAGEMENT_ENABLED", "true");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      limit: 20,
      remaining: 0,
      resetAt: Date.now() + 10_000,
    });
    expect((await invoke()).status).toBe(429);

    vi.mocked(checkRateLimit).mockRejectedValueOnce(new RateLimitUnavailableError());
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await invoke()).status).toBe(503);
    expect(revokeApiKey).not.toHaveBeenCalled();
  });

  it.each(["missing-origin", "foreign-origin", "missing-header", "cross-site"])(
    "rejects CSRF violations before authentication: %s",
    async (kind) => {
      const incoming = request();
      if (kind === "missing-origin") incoming.headers.delete("origin");
      if (kind === "foreign-origin") incoming.headers.set("origin", "http://evil.test");
      if (kind === "missing-header") incoming.headers.delete("x-dso-csrf");
      if (kind === "cross-site") incoming.headers.set("sec-fetch-site", "cross-site");

      expect((await invoke(incoming)).status).toBe(403);
      expect(authenticateSession).not.toHaveBeenCalled();
      expect(revokeApiKey).not.toHaveBeenCalled();
    },
  );

  it("requires JSON and a session", async () => {
    expect((await invoke(request("{}", { "content-type": "text/plain" }))).status).toBe(
      415,
    );
    expect((await invoke(request("{}", { cookie: "" }))).status).toBe(401);
    expect(revokeApiKey).not.toHaveBeenCalled();
  });

  it("rejects malformed and invalid request identifiers", async () => {
    expect((await invoke(request("{"))).status).toBe(400);
    expect((await invoke(request("[]"))).status).toBe(400);
    expect(
      (await invoke(request(JSON.stringify({ projectId: "../invalid" })))).status,
    ).toBe(400);
    expect((await invoke(request(), "../api-key")).status).toBe(400);
    expect(revokeApiKey).not.toHaveBeenCalled();
  });

  it("rejects an API-key ID supplied in the request body", async () => {
    const bodyApiKeyId = "00000000-0000-4000-8000-000000000009";

    const result = await invoke(
      request(JSON.stringify({ projectId, apiKeyId: bodyApiKeyId })),
    );

    expect(result.status).toBe(400);
    expect(await result.json()).toMatchObject({
      error: {
        code: "invalid-request",
        issues: [{ field: "apiKeyId", code: "unknown-field" }],
      },
    });
    expect(revokeApiKey).not.toHaveBeenCalled();
  });

  it("rejects oversized request bodies", async () => {
    const body = JSON.stringify({ projectId });
    const oversized = body + " ".repeat(CONTRACT_LIMITS.requestBodyBytes);

    expect((await invoke(request(oversized))).status).toBe(413);
    expect(revokeApiKey).not.toHaveBeenCalled();
  });

  it.each([new ProjectAccessDeniedError(), new ResourceNotFoundError()])(
    "maps a service access failure: %s",
    async (error) => {
      vi.mocked(revokeApiKey).mockRejectedValue(error);

      const result = await invoke();

      expect(result.status).toBe(error instanceof ProjectAccessDeniedError ? 403 : 404);
    },
  );

  it("does not expose unexpected error details or the stored hash", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(revokeApiKey).mockRejectedValue(
      new Error(`database detail ${revoked.keyHash}`),
    );

    const result = await invoke();
    const body = await result.json();

    expect(result.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain(revoked.keyHash);
  });
});
