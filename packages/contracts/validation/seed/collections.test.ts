import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import {
  findDuplicateIds,
  validateSeedCollectionSizes,
} from "@repo/contracts/validation/seed/collections";
import { describe, expect, it } from "vitest";

describe("findDuplicateIds", () => {
  it("accepts unique IDs", () => {
    expect(findDuplicateIds(validSeed.projects, "projects")).toEqual([]);
  });

  it("rejects duplicate IDs", () => {
    const projects = [...validSeed.projects, { ...validSeed.projects[0]! }];

    expect(findDuplicateIds(projects, "projects")).toContainEqual(
      expect.objectContaining({
        code: "duplicate-id",
        collection: "projects",
        id: "project-1",
      }),
    );
  });
});

describe("validateSeedCollectionSizes", () => {
  it("accepts collections within the configured limit", () => {
    expect(validateSeedCollectionSizes(validSeed)).toEqual([]);
  });

  it("rejects a collection that exceeds the configured limit", () => {
    const seed = structuredClone(validSeed);

    for (let index = 0; index <= 1_000; index += 1) {
      seed.users.push({
        ...validSeed.users[0]!,
        id: `user-${index}`,
      });
    }

    expect(validateSeedCollectionSizes(seed)).toContainEqual(
      expect.objectContaining({
        code: "too-many-items",
        collection: "users",
      }),
    );
  });
});
