import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { validateReleases } from "@repo/contracts/validation/seed/releases";
import { describe, expect, it } from "vitest";

const cloneSeed = () => structuredClone(validSeed);

describe("validateReleases", () => {
  it("accepts a valid published release", () => {
    expect(validateReleases(validSeed)).toEqual([]);
  });

  it("rejects a release for a missing project", () => {
    const seed = cloneSeed();
    seed.releases[0]!.projectId = "missing-project";

    expect(validateReleases(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "releases",
        field: "projectId",
      }),
    );
  });

  it("rejects an unsupported release status", () => {
    const seed = cloneSeed();
    seed.releases[0]!.status = "archived" as never;

    expect(validateReleases(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-enum",
        collection: "releases",
        field: "status",
      }),
    );
  });

  it("rejects a published release without publishedAt", () => {
    const seed = cloneSeed();
    seed.releases[0]!.publishedAt = null;

    expect(validateReleases(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "releases",
        field: "publishedAt",
      }),
    );
  });

  it("rejects a draft release with publishedAt", () => {
    const seed = cloneSeed();
    seed.releases[0]!.status = "draft";

    expect(validateReleases(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "releases",
        field: "publishedAt",
      }),
    );
  });
});
