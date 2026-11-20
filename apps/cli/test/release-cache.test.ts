import { releaseCachePath, requireReleaseId } from "@repo/cli/cache/cache-path";
import { writeVerifiedReleaseCache } from "@repo/cli/cache/release-cache";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { createSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import { generateKeyPairSync } from "node:crypto";
import { chmod, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const releaseId = "00000000-0000-4000-8000-000000000001";
const keyPair = generateKeyPairSync("ed25519");
const directories: string[] = [];

function envelope(): SignedPublishedReleaseResponse {
  return createSignedReleaseEnvelope(
    {
      schemaVersion: 1,
      release: {
        id: releaseId,
        projectId: "project-1",
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
  const value = await mkdtemp(join(tmpdir(), "dso-cache-"));
  directories.push(value);
  return value;
}

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await chmod(directory, 0o755).catch(() => undefined);
    await rm(directory, { recursive: true, force: true });
  }
});

describe("verified release cache", () => {
  it("uses a deterministic UUID cache path", () => {
    const cacheDirectory = join(process.cwd(), "cache");

    expect(releaseCachePath(cacheDirectory, releaseId)).toBe(
      join(cacheDirectory, `${releaseId}.json`),
    );
    expect(() => requireReleaseId("../release")).toThrow();
  });

  it("writes a complete parsed envelope and no temporary file remains", async () => {
    const cacheDirectory = await directory();
    const path = releaseCachePath(cacheDirectory, releaseId);

    await writeVerifiedReleaseCache(path, envelope());

    expect(JSON.parse(await readFile(path, "utf8"))).toEqual(envelope());
    expect(await readdir(cacheDirectory)).toEqual([`${releaseId}.json`]);
  });

  it("keeps existing bytes when temporary file writing fails", async () => {
    const cacheDirectory = await directory();
    const path = releaseCachePath(cacheDirectory, releaseId);
    const previous = Buffer.from("existing-cache\n");
    await writeFile(path, previous);
    await chmod(cacheDirectory, 0o555);

    await expect(writeVerifiedReleaseCache(path, envelope())).rejects.toThrow();
    expect(await readFile(path)).toEqual(previous);
  });
});
