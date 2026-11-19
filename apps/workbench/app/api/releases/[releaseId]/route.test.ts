import { getBearerApiKeyCredential } from "@/server/bearer-authentication";
import { getReleaseSigningConfiguration } from "@/server/config";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import {
  InvalidApiKeyCredentialError,
  ResourceNotFoundError,
} from "@repo/application/errors";
import { downloadReleaseWithApiKey } from "@repo/application/services/download-release";
import { getPublishedReleaseForSession } from "@repo/application/services/published-releases";
import { verifyRelease } from "@repo/release-protocol/verify";
import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/server/bearer-authentication", () => ({
  getBearerApiKeyCredential: vi.fn(),
}));
vi.mock("@/server/current-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@/server/config", () => ({ getReleaseSigningConfiguration: vi.fn() }));
vi.mock("@repo/application/services/download-release", () => ({
  downloadReleaseWithApiKey: vi.fn(),
}));
vi.mock("@repo/application/services/published-releases", () => ({
  getPublishedReleaseForSession: vi.fn(),
}));

const releaseId = "00000000-0000-4000-8000-000000000001";
const credential = "dso_0011223344556677_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const context = {
  sessionId: "00000000-0000-4000-8000-000000000002",
  userId: "00000000-0000-4000-8000-000000000003",
};
const response = {
  schemaVersion: 1 as const,
  release: {
    id: releaseId,
    projectId: "00000000-0000-4000-8000-000000000004",
    version: "1",
    status: "published" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    publishedAt: "2026-01-01T00:00:00.000Z",
  },
  tokenTypes: [],
  tokens: [],
  references: [],
  components: [],
  templates: [],
};
const signingKeyPair = generateKeyPairSync("ed25519");
const signingKeyId = "release-key-test";

function routeRequest(headers: Record<string, string> = {}): Request {
  return new Request(`https://workbench.example.test/api/releases/${releaseId}`, {
    headers,
  });
}

function invoke(request = routeRequest(), id = releaseId) {
  return GET(request, { params: Promise.resolve({ releaseId: id }) });
}

describe("GET /api/releases/:releaseId", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    vi.mocked(getBearerApiKeyCredential).mockReturnValue(credential);
    vi.mocked(getPublishedReleaseForSession).mockResolvedValue(response);
    vi.mocked(downloadReleaseWithApiKey).mockResolvedValue(response);
    vi.mocked(getReleaseSigningConfiguration).mockReturnValue({
      keyId: signingKeyId,
      privateKey: signingKeyPair.privateKey,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("uses a session when one is available and ignores Bearer authentication", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(context);
    const incoming = routeRequest({ authorization: `Bearer ${credential}` });

    const result = await invoke(incoming);
    const body = await result.json();

    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject(response);
    expect(body.signature).toMatchObject({
      algorithm: "Ed25519",
      keyId: signingKeyId,
    });
    expect(
      verifyRelease(body, {
        [signingKeyId]: signingKeyPair.publicKey,
      }),
    ).toBe(true);
    expect(getPublishedReleaseForSession).toHaveBeenCalledWith(
      getDatabasePool(),
      context,
      releaseId,
    );
    expect(getBearerApiKeyCredential).not.toHaveBeenCalled();
    expect(downloadReleaseWithApiKey).not.toHaveBeenCalled();
  });

  it("uses the parsed Bearer credential when no session is available", async () => {
    const incoming = routeRequest({ authorization: `Bearer ${credential}` });
    const before = structuredClone(response);

    const result = await invoke(incoming);
    const body = await result.json();

    expect(result.status).toBe(200);
    expect(body).toMatchObject(response);
    expect(body.signature).toMatchObject({
      algorithm: "Ed25519",
      keyId: signingKeyId,
    });
    expect(response).toEqual(before);
    expect(getBearerApiKeyCredential).toHaveBeenCalledWith(incoming);
    expect(downloadReleaseWithApiKey).toHaveBeenCalledWith(
      getDatabasePool(),
      credential,
      releaseId,
    );
    expect(getPublishedReleaseForSession).not.toHaveBeenCalled();
  });

  it("returns 401 when neither authentication method is valid", async () => {
    vi.mocked(getBearerApiKeyCredential).mockImplementation(() => {
      throw new InvalidApiKeyCredentialError();
    });

    const result = await invoke();

    expect(result.status).toBe(401);
    expect(await result.json()).toMatchObject({
      ok: false,
      error: { code: "invalid-api-key-credential" },
    });
    expect(downloadReleaseWithApiKey).not.toHaveBeenCalled();
    expect(getReleaseSigningConfiguration).not.toHaveBeenCalled();
  });

  it("maps inaccessible session releases to 404", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(context);
    vi.mocked(getPublishedReleaseForSession).mockRejectedValue(
      new ResourceNotFoundError(),
    );

    const result = await invoke();

    expect(result.status).toBe(404);
  });

  it.each([new InvalidApiKeyCredentialError(), new ResourceNotFoundError()])(
    "maps API-key release errors: %s",
    async (error) => {
      vi.mocked(downloadReleaseWithApiKey).mockRejectedValue(error);

      const result = await invoke();

      expect(result.status).toBe(
        error instanceof InvalidApiKeyCredentialError ? 401 : 404,
      );
    },
  );

  it.each(["", "../release", " ".repeat(4)])(
    "rejects a malformed release identifier",
    async (invalidReleaseId) => {
      const result = await invoke(routeRequest(), invalidReleaseId);

      expect(result.status).toBe(400);
      expect(await result.json()).toMatchObject({
        ok: false,
        error: { code: "invalid-request" },
      });
      expect(getDatabasePool).not.toHaveBeenCalled();
      expect(getCurrentSession).not.toHaveBeenCalled();
    },
  );

  it("maps unexpected service failures to a generic 500 response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(downloadReleaseWithApiKey).mockRejectedValue(
      new Error(`database detail ${credential}`),
    );

    const result = await invoke();
    const body = await result.json();

    expect(result.status).toBe(500);
    expect(body).toMatchObject({ ok: false, error: { code: "internal-error" } });
    expect(JSON.stringify(body)).not.toContain(credential);
  });

  it("maps signing configuration failures to a generic 500 response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getReleaseSigningConfiguration).mockImplementation(() => {
      throw new Error("private key location: /secret/release-key.pem");
    });

    const result = await invoke();
    const body = await result.json();

    expect(result.status).toBe(500);
    expect(body).toMatchObject({ ok: false, error: { code: "internal-error" } });
    expect(JSON.stringify(body)).not.toContain("private key");
    expect(JSON.stringify(body)).not.toContain("/secret/");
  });

  it("rejects unsigned payloads that exceed the response limit", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(downloadReleaseWithApiKey).mockResolvedValue({
      ...response,
      components: [
        {
          id: "00000000-0000-4000-8000-000000000005",
          projectId: response.release.projectId,
          name: "Large",
          slug: "large",
          description: "x".repeat(5 * 1024 * 1024),
          documentPath: "large.md",
        },
      ],
    });

    const result = await invoke();

    expect(result.status).toBe(500);
    expect(await result.json()).toMatchObject({
      ok: false,
      error: { code: "internal-error" },
    });
  });
});
