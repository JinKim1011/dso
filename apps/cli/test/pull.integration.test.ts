import { runPull } from "@repo/cli/commands/pull";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { createSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import { generateKeyPairSync } from "node:crypto";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const releaseId = "00000000-0000-4000-8000-000000000001";
const keyId = "release-key-integration";
const apiKey = "dso_test_api_key";
const keyPair = generateKeyPairSync("ed25519");

let server: Server | undefined;
let directory: string | undefined;

function signedEnvelope(): SignedPublishedReleaseResponse {
  return createSignedReleaseEnvelope(
    {
      schemaVersion: 1,
      release: {
        id: releaseId,
        projectId: "00000000-0000-4000-8000-000000000002",
        version: "1",
        status: "published",
        createdAt: "2026-01-01T00:00:00.000Z",
        publishedAt: "2026-01-01T00:00:00.000Z",
      },
      tokenTypes: [],
      tokens: [],
      references: [],
      components: [],
      templates: [],
    },
    { privateKey: keyPair.privateKey, keyId },
  );
}

async function startServer(
  current: () => SignedPublishedReleaseResponse,
): Promise<string> {
  server = createServer((request, response) => {
    expect(request.method).toBe("GET");
    expect(request.url).toBe(`/api/releases/${releaseId}`);
    expect(request.headers.authorization).toBe(`Bearer ${apiKey}`);
    response.statusCode = 200;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify(current()));
  });

  await new Promise<void>((resolve, reject) => {
    server!.once("error", reject);
    server!.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not expose a TCP address.");
  }
  return `http://127.0.0.1:${address.port}`;
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("DSO_API_KEY", apiKey);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  if (server) {
    await new Promise<void>((resolve, reject) =>
      server!.close((error) => (error ? reject(error) : resolve())),
    );
    server = undefined;
  }
  if (directory) {
    await rm(directory, { recursive: true, force: true });
    directory = undefined;
  }
});

describe("dso pull integration", () => {
  it("stores a verified release and preserves it after tampering", async () => {
    let response = signedEnvelope();
    const apiUrl = await startServer(() => response);
    directory = await mkdtemp(join(tmpdir(), "dso-pull-integration-"));
    const trustFile = join(directory, "trust.json");
    const cacheDirectory = join(directory, "cache");
    const publicKey = keyPair.publicKey
      .export({ format: "pem", type: "spki" })
      .toString();
    await writeFile(trustFile, JSON.stringify({ keys: { [keyId]: publicKey } }));
    vi.stubEnv("DSO_API_URL", apiUrl);
    vi.stubEnv("DSO_RELEASE_TRUST_FILE", trustFile);

    const cacheFile = await runPull([
      "--release",
      releaseId,
      "--cache-dir",
      cacheDirectory,
    ]);
    const verifiedBytes = await readFile(cacheFile);
    expect(JSON.parse(verifiedBytes.toString("utf8"))).toEqual(response);

    response = {
      ...response,
      release: { ...response.release, version: "2" },
    };

    await expect(
      runPull(["--release", releaseId, "--cache-dir", cacheDirectory]),
    ).rejects.toThrow("signed release could not be verified");
    expect(await readFile(cacheFile)).toEqual(verifiedBytes);
  });
});
