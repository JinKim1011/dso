import {
  readVerifiedReleaseCache,
  ReleaseCacheReadError,
  ReleaseCacheVerificationError,
} from "@repo/cli/cache/read-release-cache";
import { releaseCachePath } from "@repo/cli/cache/cache-path";
import { writeVerifiedReleaseCache } from "@repo/cli/cache/release-cache";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { createSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import { MAX_RELEASE_RESPONSE_BYTES } from "@repo/release-protocol/limits";
import { generateKeyPairSync } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const releaseId = "00000000-0000-4000-8000-000000000001";
const keyId = "release-key-test";
const keyPair = generateKeyPairSync("ed25519");
const directories: string[] = [];

function envelope(id: string = releaseId): SignedPublishedReleaseResponse {
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
    { privateKey: keyPair.privateKey, keyId },
  );
}

async function fixture(): Promise<{
  cacheDirectory: string;
  trustFilePath: string;
}> {
  const directory = await mkdtemp(join(tmpdir(), "dso-read-cache-"));
  directories.push(directory);
  const cacheDirectory = join(directory, "cache");
  const trustFilePath = join(directory, "trust.json");
  const publicKey = keyPair.publicKey.export({ format: "pem", type: "spki" }).toString();

  await writeFile(trustFilePath, JSON.stringify({ keys: { [keyId]: publicKey } }));
  await mkdir(cacheDirectory);

  return { cacheDirectory, trustFilePath };
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("readVerifiedReleaseCache", () => {
  it("reads and re-verifies a valid cache", async () => {
    const options = await fixture();
    const expected = envelope();
    await writeVerifiedReleaseCache(
      releaseCachePath(options.cacheDirectory, releaseId),
      expected,
    );

    expect(await readVerifiedReleaseCache({ ...options, releaseId })).toEqual(expected);
  });

  it("rejects tampered cache bytes", async () => {
    const options = await fixture();
    const cachePath = releaseCachePath(options.cacheDirectory, releaseId);
    await writeVerifiedReleaseCache(cachePath, envelope());
    const parsed = JSON.parse(await readFile(cachePath, "utf8"));
    parsed.release.version = "2";
    await writeFile(cachePath, `${JSON.stringify(parsed)}\n`);

    await expect(
      readVerifiedReleaseCache({ ...options, releaseId }),
    ).rejects.toBeInstanceOf(ReleaseCacheVerificationError);
  });

  it("rejects an unknown signing key", async () => {
    const options = await fixture();
    await writeVerifiedReleaseCache(
      releaseCachePath(options.cacheDirectory, releaseId),
      envelope(),
    );
    await writeFile(
      options.trustFilePath,
      JSON.stringify({
        keys: {
          "different-key": keyPair.publicKey
            .export({ format: "pem", type: "spki" })
            .toString(),
        },
      }),
    );

    await expect(
      readVerifiedReleaseCache({ ...options, releaseId }),
    ).rejects.toBeInstanceOf(ReleaseCacheVerificationError);
  });

  it("rejects malformed JSON and invalid UTF-8", async () => {
    const options = await fixture();
    const cachePath = releaseCachePath(options.cacheDirectory, releaseId);
    await writeFile(cachePath, "{");

    await expect(
      readVerifiedReleaseCache({ ...options, releaseId }),
    ).rejects.toBeInstanceOf(ReleaseCacheReadError);

    await writeFile(cachePath, Buffer.from([0xc3, 0x28]));

    await expect(
      readVerifiedReleaseCache({ ...options, releaseId }),
    ).rejects.toBeInstanceOf(ReleaseCacheReadError);
  });

  it("rejects oversized cache files", async () => {
    const options = await fixture();
    const cachePath = releaseCachePath(options.cacheDirectory, releaseId);
    await writeFile(cachePath, "x".repeat(MAX_RELEASE_RESPONSE_BYTES + 2));

    await expect(
      readVerifiedReleaseCache({ ...options, releaseId }),
    ).rejects.toBeInstanceOf(ReleaseCacheReadError);
  });

  it.skipIf(process.platform === "win32")("rejects cache symlinks", async () => {
    const options = await fixture();
    const target = join(options.cacheDirectory, "target.json");
    const cachePath = releaseCachePath(options.cacheDirectory, releaseId);
    await writeVerifiedReleaseCache(target, envelope());
    await symlink(target, cachePath);

    await expect(
      readVerifiedReleaseCache({ ...options, releaseId }),
    ).rejects.toBeInstanceOf(ReleaseCacheReadError);
  });

  it("rejects a cache whose release ID differs from the request", async () => {
    const options = await fixture();
    const otherReleaseId = "00000000-0000-4000-8000-000000000099";
    await writeVerifiedReleaseCache(
      releaseCachePath(options.cacheDirectory, releaseId),
      envelope(otherReleaseId),
    );

    await expect(
      readVerifiedReleaseCache({ ...options, releaseId }),
    ).rejects.toBeInstanceOf(ReleaseCacheVerificationError);
  });

  it("does not require API credentials or an API URL", async () => {
    const options = await fixture();
    await writeVerifiedReleaseCache(
      releaseCachePath(options.cacheDirectory, releaseId),
      envelope(),
    );
    const originalApiKey = process.env.DSO_API_KEY;
    const originalApiUrl = process.env.DSO_API_URL;
    delete process.env.DSO_API_KEY;
    delete process.env.DSO_API_URL;

    try {
      await expect(readVerifiedReleaseCache({ ...options, releaseId })).resolves.toEqual(
        envelope(),
      );
    } finally {
      if (originalApiKey === undefined) delete process.env.DSO_API_KEY;
      else process.env.DSO_API_KEY = originalApiKey;
      if (originalApiUrl === undefined) delete process.env.DSO_API_URL;
      else process.env.DSO_API_URL = originalApiUrl;
    }
  });
});
