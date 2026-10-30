import type { Release } from "@repo/contracts/type";
import type { ReleaseStatus } from "@repo/contracts/validation/enum";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type ReleaseRow = QueryResultRow & {
  id: string;
  project_id: string;
  version: string;
  status: ReleaseStatus;
  created_at: Date;
  published_at: Date | null;
};

function mapReleaseRow(row: ReleaseRow): Release {
  return {
    id: row.id,
    projectId: row.project_id,
    version: row.version,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    publishedAt: row.published_at?.toISOString() ?? null,
  };
}

export async function insertRelease(
  database: Queryable,
  release: Release,
): Promise<Release> {
  const result = await database.query<ReleaseRow>(
    `
      INSERT INTO releases (id, project_id, version, status, created_at, published_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, project_id, version, status, created_at, published_at
    `,
    [
      release.id,
      release.projectId,
      release.version,
      release.status,
      release.createdAt,
      release.publishedAt,
    ],
  );

  return mapReleaseRow(result.rows[0]);
}
