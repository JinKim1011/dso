import { getDatabasePool } from "@/server/database";
import {
  DomainValidationError,
  ProjectAccessDeniedError,
  StagedChangesConflictError,
} from "@repo/application/errors";
import { authenticateSession } from "@repo/application/services/authentication";
import { publishStagedChanges } from "@repo/application/services/staged-publishing";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@repo/application/services/authentication", () => ({
  authenticateSession: vi.fn(),
}));
vi.mock("@repo/application/services/staged-publishing", () => ({
  publishStagedChanges: vi.fn(),
}));

const origin = "http://localhost:3000";
const projectId = "00000000-0000-4000-8000-000000000001";
const sessionId = "00000000-0000-4000-8000-000000000002";
const context = { sessionId, userId: "00000000-0000-4000-8000-000000000004" };
const release = {
  id: "00000000-0000-4000-8000-000000000005",
  projectId,
  version: "1",
  status: "published" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  publishedAt: "2026-01-01T00:00:00.000Z",
};

function request(
  body = JSON.stringify({ projectId, changes: [] }),
  headers: Record<string, string> = {},
) {
  return new Request(`${origin}/api/releases/publish`, {
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

describe("publish request boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "postgres://localhost/example");
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
    vi.stubEnv("SESSION_COOKIE_NAME", "dso_session");
    vi.mocked(authenticateSession).mockResolvedValue(context);
    vi.mocked(publishStagedChanges).mockResolvedValue({
      release,
      tokens: [],
      references: [],
    });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("authenticates and forwards the validated request", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: true,
      release,
      tokens: [],
      references: [],
    });
    expect(publishStagedChanges).toHaveBeenCalledWith(getDatabasePool(), context, {
      projectId,
      changes: [],
    });
  });

  it.each(["production", "test", ""])(
    "is unavailable outside development: %s",
    async (env) => {
      vi.stubEnv("NODE_ENV", env);
      const response = await POST(request());
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
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
      const response = await POST(incoming);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        ok: false,
        error: { code: "request-rejected", message: "The request was rejected." },
      });
      expect(authenticateSession).not.toHaveBeenCalled();
    },
  );

  it("requires JSON and a session", async () => {
    expect((await POST(request("{}", { "content-type": "text/plain" }))).status).toBe(
      415,
    );
    expect((await POST(request("{}", { cookie: "" }))).status).toBe(401);
    expect(publishStagedChanges).not.toHaveBeenCalled();
  });

  it("validates the JSON body and enforces the byte and change-count limits", async () => {
    expect((await POST(request("{"))).status).toBe(400);
    expect(
      (await POST(request(JSON.stringify({ projectId, changes: [], extra: true }))))
        .status,
    ).toBe(400);
    expect(
      (await POST(request(JSON.stringify({ projectId, changes: Array(1001).fill({}) }))))
        .status,
    ).toBe(400);
    const json = JSON.stringify({ projectId, changes: [] });
    const atLimit = json + " ".repeat(CONTRACT_LIMITS.requestBodyBytes - json.length);
    expect((await POST(request(atLimit))).status).toBe(200);
    expect((await POST(request(atLimit + " ", { "content-length": "1" }))).status).toBe(
      413,
    );
    expect(publishStagedChanges).toHaveBeenCalledTimes(1);
  });

  it.each([
    [new ProjectAccessDeniedError(), 403, "project-access-denied"],
    [new StagedChangesConflictError([]), 409, "staged-changes-conflict"],
    [
      new DomainValidationError([
        { code: "no-changes", message: "There are no changes to publish." },
      ]),
      422,
      "domain-validation",
    ],
  ])("maps application error %s", async (error, status, code) => {
    vi.mocked(publishStagedChanges).mockRejectedValue(error);
    const response = await POST(request());
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ ok: false, error: { code } });
  });

  it("does not expose unexpected error details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(publishStagedChanges).mockRejectedValue(
      new Error("sensitive database details"),
    );
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "internal-error",
      message: "The request could not be completed.",
      correlationId: expect.any(String),
    });
    expect(JSON.stringify({ body, logs: log.mock.calls })).not.toContain("sensitive");
  });
});
