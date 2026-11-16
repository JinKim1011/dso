import type { AuthorizationContext } from "@repo/application/types";
import { listProjectsByUserId } from "@repo/db/repositories/projects";
import type { Pool } from "pg";

export async function listAccessibleProjects(
  database: Pick<Pool, "query">,
  context: AuthorizationContext,
) {
  return listProjectsByUserId(database, context.userId);
}
