import { ProjectAccessDeniedError } from "@repo/application/errors";
import type { ProjectMember } from "@repo/contracts/type";
import type { ProjectMemberRole } from "@repo/contracts/validation/enum";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type ProjectMemberRow = QueryResultRow & {
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  created_at: Date;
};

function mapProjectMemberRow(row: ProjectMemberRow): ProjectMember {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

export async function insertProjectMember(
  database: Queryable,
  projectMember: ProjectMember,
): Promise<ProjectMember> {
  const result = await database.query<ProjectMemberRow>(
    `
      INSERT INTO project_members (project_id, user_id, role, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING project_id, user_id, role, created_at
    `,
    [
      projectMember.projectId,
      projectMember.userId,
      projectMember.role,
      projectMember.createdAt,
    ],
  );

  return mapProjectMemberRow(result.rows[0]!);
}

export async function findProjectMember(
  database: Queryable,
  projectId: string,
  userId: string,
): Promise<ProjectMember | null> {
  const result = await database.query<ProjectMemberRow>(
    `
      SELECT project_id, user_id, role, created_at
      FROM project_members
      WHERE project_id = $1
        AND user_id = $2
    `,
    [projectId, userId],
  );

  const row = result.rows[0];

  return row ? mapProjectMemberRow(row) : null;
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
