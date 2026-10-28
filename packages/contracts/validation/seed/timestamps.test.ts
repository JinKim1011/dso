import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { validateSeedTimestamps } from "@repo/contracts/validation/seed/timestamps";
import { describe, expect, it } from "vitest";

const cloneSeed = () => structuredClone(validSeed);

describe("validateSeedTimestamps", () => {
  it("accepts valid release timestamps", () => {
    expect(validateSeedTimestamps(validSeed)).toEqual([]);
  });

  it("rejects an invalid createdAt timestamp", () => {
    const seed = cloneSeed();
    seed.releases[0]!.createdAt = "not-a-timestamp";

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "releases",
        field: "createdAt",
      }),
    );
  });

  it("rejects an invalid publishedAt timestamp", () => {
    const seed = cloneSeed();
    seed.releases[0]!.publishedAt = "not-a-timestamp";

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "releases",
        field: "publishedAt",
      }),
    );
  });

  it("rejects publishedAt before createdAt", () => {
    const seed = cloneSeed();
    seed.releases[0]!.createdAt = "2026-10-28T10:00:00Z";
    seed.releases[0]!.publishedAt = "2026-10-27T10:00:00Z";

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "releases",
        field: "publishedAt",
      }),
    );
  });
});
