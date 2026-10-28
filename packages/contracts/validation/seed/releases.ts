import type { SeedData } from "@repo/contracts/seed";
import { isSupportedReleaseStatus } from "@repo/contracts/validation/enum";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

export function validateReleases(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const projectIds = new Set(seed.projects.map((project) => project.id));

  for (const release of seed.releases) {
    if (!projectIds.has(release.projectId)) {
      errors.push({
        code: "missing-record",
        collection: "releases",
        id: release.id,
        field: "projectId",
        message: `Project "${release.projectId}" does not exist.`,
      });
    }

    if (!isSupportedReleaseStatus(release.status)) {
      errors.push({
        code: "invalid-enum",
        collection: "releases",
        id: release.id,
        field: "status",
        message: `Release status "${release.status}" is not supported.`,
      });
    }

    if (release.status === "published" && release.publishedAt === null) {
      errors.push({
        code: "invalid-field",
        collection: "releases",
        id: release.id,
        field: "publishedAt",
        message: "Published releases must have a publishedAt timestamp.",
      });
    }

    if (release.status === "draft" && release.publishedAt !== null) {
      errors.push({
        code: "invalid-field",
        collection: "releases",
        id: release.id,
        field: "publishedAt",
        message: "Draft releases cannot have a publishedAt timestamp.",
      });
    }
  }

  return errors;
}
