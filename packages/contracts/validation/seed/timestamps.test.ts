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
    seed.releases[0]!.publishedAt = "2026-10-27T10:00:00.000Z";

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "releases",
        field: "publishedAt",
      }),
    );
  });

  it("rejects an invalid user createdAt timestamp", () => {
    const seed = cloneSeed();
    seed.users[0]!.createdAt = "not-a-timestamp";

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "users",
        id: seed.users[0]!.id,
        field: "createdAt",
      }),
    );
  });

  it("rejects an invalid project createdAt timestamp", () => {
    const seed = cloneSeed();
    seed.projects[0]!.createdAt = "not-a-timestamp";

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "projects",
        id: seed.projects[0]!.id,
        field: "createdAt",
      }),
    );
  });

  it("rejects an invalid project member createdAt timestamp", () => {
    const seed = cloneSeed();
    seed.projectMembers[0]!.createdAt = "not-a-timestamp";

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "projectMembers",
        id: `${seed.projectMembers[0]!.projectId}:${seed.projectMembers[0]!.userId}`,
        field: "createdAt",
      }),
    );
  });
});
