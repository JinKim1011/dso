import type { SeedData } from "@repo/contracts/seed";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";
import { validateTimestamp } from "@repo/contracts/validation/timestamp";

export function validateSeedTimestamps(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

  for (const release of seed.releases) {
    const createdAtError = validateTimestamp(release.createdAt, "createdAt");

    if (createdAtError) {
      errors.push({
        code: "invalid-timestamp",
        collection: "releases",
        id: release.id,
        field: "createdAt",
        message: createdAtError.message,
      });
    }

    if (release.publishedAt === null) {
      continue;
    }

    const publishedAtError = validateTimestamp(release.publishedAt, "publishedAt");

    if (publishedAtError) {
      errors.push({
        code: "invalid-timestamp",
        collection: "releases",
        id: release.id,
        field: "publishedAt",
        message: publishedAtError.message,
      });
      continue;
    }

    if (Date.parse(release.publishedAt) < Date.parse(release.createdAt)) {
      errors.push({
        code: "invalid-timestamp",
        collection: "releases",
        id: release.id,
        field: "publishedAt",
        message: "publishedAt cannot be earlier than createdAt.",
      });
    }
  }

  for (const user of seed.users) {
    const createdAtError = validateTimestamp(user.createdAt, "createdAt");

    if (createdAtError) {
      errors.push({
        code: "invalid-timestamp",
        collection: "users",
        id: user.id,
        field: "createdAt",
        message: createdAtError.message,
      });
    }
  }

  for (const project of seed.projects) {
    const createdAtError = validateTimestamp(project.createdAt, "createdAt");

    if (createdAtError) {
      errors.push({
        code: "invalid-timestamp",
        collection: "projects",
        id: project.id,
        field: "createdAt",
        message: createdAtError.message,
      });
    }
  }

  for (const projectMember of seed.projectMembers) {
    const createdAtError = validateTimestamp(projectMember.createdAt, "createdAt");
    const key = [projectMember.projectId, projectMember.userId].join(":");

    if (createdAtError) {
      errors.push({
        code: "invalid-timestamp",
        collection: "projectMembers",
        id: key,
        field: "createdAt",
        message: createdAtError.message,
      });
    }
  }
  return errors;
}
