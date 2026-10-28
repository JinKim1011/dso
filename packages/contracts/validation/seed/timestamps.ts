import type { SeedData } from "@repo/contracts/seed";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

function validateTimestamp(value: unknown, fieldName: string): string | null {
  if (typeof value !== "string") {
    return `${fieldName} must be an ISO timestamp.`;
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return `${fieldName} must be a valid ISO timestamp.`;
  }

  return null;
}

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
        message: createdAtError,
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
        message: publishedAtError,
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

  return errors;
}
