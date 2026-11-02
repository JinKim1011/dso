import type { Project } from "@repo/contracts/type";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type ProjectRow = QueryResultRow & {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at.toISOString(),
  };
}

export async function insertProject(
  database: Queryable,
  project: Project,
): Promise<Project> {
  const result = await database.query<ProjectRow>(
    `
      INSERT INTO projects (id, name, slug, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, slug, created_at
    `,
    [project.id, project.name, project.slug, project.createdAt],
  );

  return mapProjectRow(result.rows[0]!);
}

export async function findProjectById(
  database: Queryable,
  projectId: string,
): Promise<Project | null> {
  if (!UUID_PATTERN.test(projectId)) {
    return null;
  }

  const result = await database.query<ProjectRow>(
    `
      SELECT id, name, slug, created_at
      FROM projects
      WHERE id = $1
    `,
    [projectId],
  );

  const row = result.rows[0];

  return row ? mapProjectRow(row) : null;
}
