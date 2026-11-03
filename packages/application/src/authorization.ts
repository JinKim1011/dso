import { ProjectAccessDeniedError } from "@repo/application/errors";
import { ProjectMember } from "@repo/contracts/type";
import type { ProjectMemberRole } from "@repo/contracts/validation/enum";
import { findProjectMember } from "@repo/db/repositories/memberships";
import type { Pool } from "pg";

const ROLE_LEVEL: Record<ProjectMemberRole, number> = {
  editor: 1,
  publisher: 2,
  admin: 3,
};

export function requiredProjectRole(
  access: { projectId: string; role: ProjectMemberRole },
  projectId: string,
  minimumRole: ProjectMemberRole,
): void {
  if (access.projectId !== projectId) {
    throw new ProjectAccessDeniedError();
  }

  if (ROLE_LEVEL[access.role] < ROLE_LEVEL[minimumRole]) {
    throw new ProjectAccessDeniedError();
  }
}

export async function requireProjectAccess(
  database: Pool,
  userId: string,
  projectId: string,
): Promise<ProjectMember> {
  const membership = await findProjectMember(database, projectId, userId);

  if (!membership) {
    throw new ProjectAccessDeniedError();
  }

  return membership;
}
