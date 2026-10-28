import type { SeedData } from "@repo/contracts/seed";
import { isSupportedProjectMemberRole } from "@repo/contracts/validation/enum";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

export function validateMemberships(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const userIds = new Set(seed.users.map((user) => user.id));
  const projectIds = new Set(seed.projects.map((project) => project.id));
  const seen = new Set<string>();

  for (const membership of seed.projectMembers) {
    const id = `${membership.projectId}:${membership.userId}`;

    if (seen.has(id)) {
      errors.push({
        code: "duplicate-id",
        collection: "projectMembers",
        id,
        message: `Duplicate membership for project "${membership.projectId}" and user "${membership.userId}".`,
      });
    }

    seen.add(id);

    if (!projectIds.has(membership.projectId)) {
      errors.push({
        code: "missing-record",
        collection: "projectMembers",
        id,
        field: "projectId",
        message: `Project "${membership.projectId}" does not exist.`,
      });
    }

    if (!userIds.has(membership.userId)) {
      errors.push({
        code: "missing-record",
        collection: "projectMembers",
        id,
        field: "userId",
        message: `User "${membership.userId}" does not exist.`,
      });
    }

    if (!isSupportedProjectMemberRole(membership.role)) {
      errors.push({
        code: "invalid-enum",
        collection: "projectMembers",
        id,
        field: "role",
        message: `Membership role "${membership.role}" is not supported.`,
      });
    }
  }

  return errors;
}
