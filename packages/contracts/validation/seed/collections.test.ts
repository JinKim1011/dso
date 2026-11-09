import {
  findDuplicateIds,
  validateSeedCollectionSizes,
} from "@repo/contracts/validation/seed/collections";
import {
  createSeedData,
  seedProjectFixture,
  seedUserFixture,
} from "@repo/contracts/fixtures/seed-contracts";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { describe, expect, it } from "vitest";

describe("findDuplicateIds", () => {
  it("accepts unique IDs", () => {
    const projects = [
      seedProjectFixture,
      { ...seedProjectFixture, id: "second-project", slug: "second-project" },
    ];

    expect(findDuplicateIds(projects, "projects")).toEqual([]);
  });

  it("rejects duplicate IDs", () => {
    const projects = [seedProjectFixture, { ...seedProjectFixture }];

    expect(findDuplicateIds(projects, "projects")).toContainEqual(
      expect.objectContaining({
        code: "duplicate-id",
        collection: "projects",
        id: seedProjectFixture.id,
      }),
    );
  });
});

describe("validateSeedCollectionSizes", () => {
  it("accepts collections within the configured limit", () => {
    const seed = createSeedData({
      users: [seedUserFixture],
      projects: [seedProjectFixture],
    });

    expect(validateSeedCollectionSizes(seed)).toEqual([]);
  });

  it("rejects a collection that exceeds the configured limit", () => {
    const users = Array.from(
      { length: CONTRACT_LIMITS.collectionItems + 1 },
      (_, index) => ({
        ...seedUserFixture,
        id: `user-${index}`,
      }),
    );
    const seed = createSeedData({ users });

    expect(validateSeedCollectionSizes(seed)).toContainEqual(
      expect.objectContaining({
        code: "too-many-items",
        collection: "users",
      }),
    );
  });
});
