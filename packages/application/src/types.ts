import type { ProjectMemberRole } from "@repo/contracts/validation/enum";

export type AuthorizationContext = {
  userId: string;
  sessionId: string;
};

export type ProjectAccess = {
  projectId: string;
  role: ProjectMemberRole;
};
