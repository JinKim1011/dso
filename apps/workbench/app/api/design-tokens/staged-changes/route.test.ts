import { getDatabasePool } from "@/server/database";
import {
  ProjectAccessDeniedError,
  SessionExpiredError,
  StagedChangesConflictError,
  StagedChangesValidationError,
} from "@repo/application/errors";
import { authenticateSession } from "@repo/application/services/authentication";
import { saveStagedChanges } from "@repo/application/services/staged-changes";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@repo/application/services/authentication", () => ({
  authenticateSession: vi.fn(),
}));
vi.mock("@repo/application/services/staged-changes", () => ({
  saveStagedChanges: vi.fn(),
}));

const origin = "http://localhost:3000";
const projectId = "00000000-0000-4000-8000-000000000001";
const sessionId = "00000000-0000-4000-8000-000000000002";
const context = { sessionId, userId: "00000000-0000-4000-8000-000000000003" };

function request(
  body = JSON.stringify({ projectId, changes: [] }),
  headers: Record<string, string> = {},
) {
  return new Request(`${origin}/api/design-tokens/staged-changes`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      cookie: `dso_session=${sessionId}`,
      ...headers,
    },
    body,
  });
}

describe("staged changes request boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "postgres://localhost/example");
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
    vi.stubEnv("SESSION_COOKIE_NAME", "dso_session");
    vi.mocked(authenticateSession).mockResolvedValue(context);
    vi.mocked(saveStagedChanges).mockResolvedValue({ tokens: [], references: [] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("authenticates, parses, and passes the request to the save service", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true, tokens: [], references: [] });
    expect(authenticateSession).toHaveBeenCalledWith(getDatabasePool(), sessionId);
    expect(saveStagedChanges).toHaveBeenCalledWith(getDatabasePool(), context, {
      projectId,
      changes: [],
    });
  });

  it.each(["production", "test", ""])(
    "is unavailable outside development: %s",
    async (env) => {
      vi.stubEnv("NODE_ENV", env);
      expect((await POST(request())).status).toBe(404);
      expect(getDatabasePool).not.toHaveBeenCalled();
    },
  );

  it.each(["", "null", "http://evil.test", "http://localhost:3001"])(
    "rejects an untrusted origin: %s",
    async (badOrigin) => {
      expect((await POST(request(undefined, { origin: badOrigin }))).status).toBe(403);
      expect(authenticateSession).not.toHaveBeenCalled();
    },
  );

  it("rejects a request without Origin even when Host matches", async () => {
    const incoming = request();
    incoming.headers.delete("origin");
    incoming.headers.set("host", "localhost:3000");
    expect((await POST(incoming)).status).toBe(403);
    expect(authenticateSession).not.toHaveBeenCalled();
  });

  it("does not trust Host and fails closed if the configured origin is missing or invalid", async () => {
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", "");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(request(undefined, { host: "localhost:3000" }))).status).toBe(500);
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", "http://localhost:3000/path");
    expect((await POST(request())).status).toBe(500);
    expect(saveStagedChanges).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
  });

  it("requires JSON and one session cookie", async () => {
    expect((await POST(request("{}", { "content-type": "text/plain" }))).status).toBe(
      415,
    );
    expect((await POST(request("{}", { cookie: "" }))).status).toBe(401);
    expect(
      (
        await POST(
          request("{}", { cookie: `dso_session=${sessionId}; dso_session=other` }),
        )
      ).status,
    ).toBe(401);
    expect(authenticateSession).not.toHaveBeenCalled();
  });

  it("rejects expired sessions before parsing or saving", async () => {
    vi.mocked(authenticateSession).mockRejectedValue(new SessionExpiredError());
    expect((await POST(request("not-json"))).status).toBe(401);
    expect(saveStagedChanges).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON and parser errors", async () => {
    expect((await POST(request("{"))).status).toBe(400);
    const response = await POST(
      request(JSON.stringify({ projectId, changes: [], extra: true })),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "invalid-request",
        issues: expect.arrayContaining([expect.objectContaining({ field: "extra" })]),
      },
    });
    expect(saveStagedChanges).not.toHaveBeenCalled();
  });

  it("enforces body bytes even without or despite Content-Length", async () => {
    const json = JSON.stringify({ projectId, changes: [] });
    const atLimit = json + " ".repeat(CONTRACT_LIMITS.requestBodyBytes - json.length);
    expect((await POST(request(atLimit))).status).toBe(200);
    expect((await POST(request(atLimit + " ", { "content-length": "1" }))).status).toBe(
      413,
    );
    expect(
      (
        await POST(
          request(json, {
            "content-length": String(CONTRACT_LIMITS.requestBodyBytes + 1),
          }),
        )
      ).status,
    ).toBe(413);
    expect(vi.mocked(saveStagedChanges)).toHaveBeenCalledTimes(1);
  });

  it("counts streamed UTF-8 bytes and rejects invalid UTF-8", async () => {
    const makeStreamRequest = (chunks: Uint8Array[]) =>
      new Request(`${origin}/api/design-tokens/staged-changes`, {
        method: "POST",
        headers: {
          origin,
          "content-type": "application/json",
          cookie: `dso_session=${sessionId}`,
        },
        body: new ReadableStream<Uint8Array>({
          start(controller) {
            for (const chunk of chunks) controller.enqueue(chunk);
            controller.close();
          },
        }),
        duplex: "half",
      } as RequestInit & { duplex: "half" });

    const encoder = new TextEncoder();
    const json = JSON.stringify({ projectId, changes: [] });
    const oversized = encoder.encode(
      json + " ".repeat(CONTRACT_LIMITS.requestBodyBytes - json.length - 1) + "한",
    );
    expect(oversized.byteLength).toBe(CONTRACT_LIMITS.requestBodyBytes + 2);
    expect(
      (await POST(makeStreamRequest([oversized.subarray(0, 10), oversized.subarray(10)])))
        .status,
    ).toBe(413);
    expect((await POST(makeStreamRequest([new Uint8Array([0xff])]))).status).toBe(400);
    expect(saveStagedChanges).not.toHaveBeenCalled();
  });

  it.each([
    [new ProjectAccessDeniedError(), 403, "project-access-denied"],
    [
      new StagedChangesConflictError([
        { code: "conflict", field: "name", tokenId: projectId, message: "changed" },
      ]),
      409,
      "staged-changes-conflict",
    ],
    [
      new StagedChangesValidationError([
        { code: "invalid-value", field: "value", tokenId: projectId, message: "invalid" },
      ]),
      422,
      "domain-validation",
    ],
  ])("maps application errors to %s", async (error, status, code) => {
    vi.mocked(saveStagedChanges).mockRejectedValue(error);
    const response = await POST(request());
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ ok: false, error: { code } });
  });

  it("does not leak unexpected database errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(saveStagedChanges).mockRejectedValue(
      new Error("sensitive database details"),
    );
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("sensitive");
    expect(JSON.stringify(log.mock.calls)).not.toContain("sensitive");
  });
});
