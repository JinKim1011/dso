import { ReleaseApiNetworkError } from "@repo/cli/api/errors";
import { writeVerifiedReleaseCache } from "@repo/cli/cache/release-cache";
import { runPull, type PullDependencies } from "@repo/cli/commands/pull";
import { parsePullArguments } from "@repo/cli/options/pull-options";
import type { CliConfiguration } from "@repo/cli/config/environment";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { createSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const releaseId = "00000000-0000-4000-8000-000000000001";
const keyPair = generateKeyPairSync("ed25519");
const directories: string[] = [];

type PullDependencyOverrides = {
  -readonly [Key in keyof PullDependencies]?: PullDependencies[Key];
};

function envelope(id = releaseId): SignedPublishedReleaseResponse {
  return createSignedReleaseEnvelope(
    {
      schemaVersion: 1,
      release: {
        id,
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
    { privateKey: keyPair.privateKey, keyId: "key-1" },
  );
}

async function directory(): Promise<string> {
  const value = await mkdtemp(join(tmpdir(), "dso-pull-"));
  directories.push(value);
  return value;
}

function dependencies(
  cachePath: string,
  overrides: PullDependencyOverrides = {},
): PullDependencies {
  const configuration: CliConfiguration = {
    apiKey: "dso_test_secret",
    apiBaseUrl: "https://api.example.test",
    trustFilePath: "/test/trust.json",
    cachePath,
  };
  const trustedKeys = new Map([["key-1", keyPair.publicKey]]);
  return {
    loadConfiguration: vi.fn().mockReturnValue(configuration),
    loadTrustFile: vi.fn().mockResolvedValue(trustedKeys),
    fetchRelease: vi.fn().mockResolvedValue(envelope()),
    verify: vi.fn().mockReturnValue(true),
    writeCache: vi.fn(writeVerifiedReleaseCache),
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((value) => rm(value, { recursive: true, force: true })),
  );
});

describe("pull command", () => {
  it("parses required and optional pull arguments", () => {
    expect(
      parsePullArguments([
        "--release",
        releaseId,
        "--trust-file=./trust.json",
        "--cache-dir",
        "./cache",
        "--api-url=https://api.example.test/base",
      ]),
    ).toEqual({
      releaseId,
      trustFile: "./trust.json",
      cacheDirectory: "./cache",
      apiUrl: "https://api.example.test/base",
    });
    expect(parsePullArguments([releaseId]).releaseId).toBe(releaseId);
  });

  it("requires a UUID release ID", () => {
    expect(() => parsePullArguments(["--release", "release-id"])).toThrow();
  });

  it("downloads, verifies, and atomically caches the release", async () => {
    const cacheDirectory = await directory();
    const deps = dependencies(cacheDirectory);

    const path = await runPull(["--release", releaseId], deps);

    expect(path).toBe(join(cacheDirectory, `${releaseId}.json`));
    expect(deps.fetchRelease).toHaveBeenCalledWith(releaseId, {
      apiBaseUrl: "https://api.example.test",
      apiKey: "dso_test_secret",
    });
    expect(deps.verify).toHaveBeenCalledOnce();
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual(envelope());
  });

  it("accepts case-insensitive UUID matching", async () => {
    const cacheDirectory = await directory();
    const requestedReleaseId = releaseId.toUpperCase();
    const deps = dependencies(cacheDirectory);

    await runPull(["--release", requestedReleaseId], deps);

    expect(deps.writeCache).toHaveBeenCalledOnce();
  });

  it("rejects an authentic envelope for a different release", async () => {
    const cacheDirectory = await directory();
    const cachePath = join(cacheDirectory, `${releaseId}.json`);
    const previous = Buffer.from("previous-cache-bytes\n");
    await writeFile(cachePath, previous);
    const substituted = envelope("00000000-0000-4000-8000-000000000099");
    const deps = dependencies(cacheDirectory, {
      fetchRelease: vi.fn().mockResolvedValue(substituted),
      verify: vi.fn().mockReturnValue(true),
    });

    await expect(runPull(["--release", releaseId], deps)).rejects.toThrow(
      "signed release could not be verified",
    );
    expect(await readFile(cachePath)).toEqual(previous);
    expect(deps.writeCache).not.toHaveBeenCalled();
  });

  it.each(["network", "malformed", "verification", "unknown-key"])(
    "keeps the previous cache on %s failure",
    async (failure) => {
      const cacheDirectory = await directory();
      const cachePath = join(cacheDirectory, `${releaseId}.json`);
      const previous = Buffer.from("previous-cache-bytes\n");
      await writeFile(cachePath, previous);
      const overrides: PullDependencyOverrides = {};

      if (failure === "network") {
        overrides.fetchRelease = vi.fn().mockRejectedValue(new ReleaseApiNetworkError());
      } else if (failure === "malformed") {
        overrides.fetchRelease = vi
          .fn()
          .mockResolvedValue({ ...envelope(), schemaVersion: 2 });
      } else if (failure === "verification") {
        overrides.verify = vi.fn().mockReturnValue(false);
      } else {
        overrides.loadTrustFile = vi.fn().mockResolvedValue(new Map());
        overrides.verify = vi.fn().mockReturnValue(false);
      }
      const deps = dependencies(cacheDirectory, overrides);

      await expect(runPull(["--release", releaseId], deps)).rejects.toThrow();
      expect(await readFile(cachePath)).toEqual(previous);
      expect(deps.writeCache).not.toHaveBeenCalled();
    },
  );

  it("keeps the previous cache when the cache writer fails", async () => {
    const cacheDirectory = await directory();
    const cachePath = join(cacheDirectory, `${releaseId}.json`);
    const previous = Buffer.from("previous-cache-bytes\n");
    await writeFile(cachePath, previous);
    const deps = dependencies(cacheDirectory, {
      writeCache: vi.fn().mockRejectedValue(new Error("disk failure")),
    });

    await expect(runPull(["--release", releaseId], deps)).rejects.toThrow("disk failure");
    expect(await readFile(cachePath)).toEqual(previous);
  });
});
