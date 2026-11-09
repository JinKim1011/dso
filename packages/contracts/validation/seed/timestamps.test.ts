import { validateSeedTimestamps } from "@repo/contracts/validation/seed/timestamps";
import {
  createSeedData,
  seedProjectFixture,
  seedProjectMemberFixture,
  seedReleaseFixture,
  seedUserFixture,
} from "@repo/contracts/fixtures/seed-contracts";
import { describe, expect, it } from "vitest";

describe("validateSeedTimestamps", () => {
  it("accepts valid release timestamps", () => {
    const seed = createSeedData({
      releases: [seedReleaseFixture],
    });

    expect(validateSeedTimestamps(seed)).toEqual([]);
  });

  it("rejects an invalid createdAt timestamp", () => {
    const seed = createSeedData({
      releases: [{ ...seedReleaseFixture, createdAt: "not-a-timestamp" }],
    });

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "releases",
        id: seedReleaseFixture.id,
        field: "createdAt",
      }),
    );
  });

  it("rejects an invalid publishedAt timestamp", () => {
    const seed = createSeedData({
      releases: [{ ...seedReleaseFixture, publishedAt: "not-a-timestamp" }],
    });

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "releases",
        id: seedReleaseFixture.id,
        field: "publishedAt",
      }),
    );
  });

  it("rejects publishedAt before createdAt", () => {
    const seed = createSeedData({
      releases: [
        {
          ...seedReleaseFixture,
          createdAt: "2026-10-28T10:00:00Z",
          publishedAt: "2026-10-27T10:00:00.000Z",
        },
      ],
    });

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "releases",
        id: seedReleaseFixture.id,
        field: "publishedAt",
      }),
    );
  });

  it("rejects an invalid user createdAt timestamp", () => {
    const seed = createSeedData({
      users: [{ ...seedUserFixture, createdAt: "not-a-timestamp" }],
    });

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "users",
        id: seedUserFixture.id,
        field: "createdAt",
      }),
    );
  });

  it("rejects an invalid project createdAt timestamp", () => {
    const seed = createSeedData({
      projects: [{ ...seedProjectFixture, createdAt: "not-a-timestamp" }],
    });

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "projects",
        id: seedProjectFixture.id,
        field: "createdAt",
      }),
    );
  });

  it("rejects an invalid project member createdAt timestamp", () => {
    const seed = createSeedData({
      projectMembers: [
        { ...seedProjectMemberFixture, createdAt: "not-a-timestamp" },
      ],
    });

    expect(validateSeedTimestamps(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-timestamp",
        collection: "projectMembers",
        id: `${seedProjectMemberFixture.projectId}:${seedProjectMemberFixture.userId}`,
        field: "createdAt",
      }),
    );
  });
});
