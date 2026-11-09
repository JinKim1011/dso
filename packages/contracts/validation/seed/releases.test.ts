import { validateReleases } from "@repo/contracts/validation/seed/releases";
import {
  createSeedData,
  seedProjectFixture,
  seedReleaseFixture,
} from "@repo/contracts/fixtures/seed-contracts";
import { describe, expect, it } from "vitest";

describe("validateReleases", () => {
  it("accepts a valid published release", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      releases: [seedReleaseFixture],
    });

    expect(validateReleases(seed)).toEqual([]);
  });

  it("rejects a release for a missing project", () => {
    const seed = createSeedData({
      releases: [{ ...seedReleaseFixture, projectId: "missing-project" }],
    });

    expect(validateReleases(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "releases",
        field: "projectId",
      }),
    );
  });

  it("rejects an unsupported release status", () => {
    const seed = createSeedData({
      releases: [{ ...seedReleaseFixture, status: "archived" as never }],
    });

    expect(validateReleases(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-enum",
        collection: "releases",
        field: "status",
      }),
    );
  });

  it("rejects a published release without publishedAt", () => {
    const seed = createSeedData({
      releases: [{ ...seedReleaseFixture, publishedAt: null }],
    });

    expect(validateReleases(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "releases",
        field: "publishedAt",
      }),
    );
  });

  it("rejects a draft release with publishedAt", () => {
    const seed = createSeedData({
      releases: [{ ...seedReleaseFixture, status: "draft" }],
    });

    expect(validateReleases(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "releases",
        field: "publishedAt",
      }),
    );
  });
});
