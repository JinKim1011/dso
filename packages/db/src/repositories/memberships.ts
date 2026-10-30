import type { ProjectMember } from "@repo/contracts/type";
import type { ProjectMemberRole } from "@repo/contracts/validation/enum";

type ProjectMemberRow = {
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  created_at: Date;
};

export function mapProjectMemberRow(row: ProjectMemberRow): ProjectMember {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}
