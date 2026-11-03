import type { ProjectMemberRole } from "@repo/contracts/validation/enum";

/**
 * Created only after the HTTP authentication middleware verifies that
 * the session exists, belongs to the user, and has not expired.
 * Application services may trust this context and do not revalidate the session.
 */
export type AuthorizationContext = {
  userId: string;
  sessionId: string;
};

export type ProjectAccess = {
  projectId: string;
  role: ProjectMemberRole;
};
