import { ProjectAccessDeniedError } from "@repo/application/errors";
import type { ProjectMemberRole } from "@repo/contracts/validation/enum";

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
