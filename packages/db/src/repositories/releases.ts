import type { Release } from "@repo/contracts/type";
import type { ReleaseStatus } from "@repo/contracts/validation/enum";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
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

export async function nextReleaseVersion(
  database: Pick<PoolClient, "query">,
  projectId: string,
): Promise<string> {
  const result = await database.query<{
    invalid_versions: boolean;
    next_version: string;
  }>(
    `
      SELECT
        COALESCE(BOOL_OR(version !~ '^[1-9][0-9]*$' OR char_length(version) > $2), false)
          AS invalid_versions,
        (COALESCE(MAX(
          CASE WHEN version ~ '^[1-9][0-9]*$' AND char_length(version) <= $2
            THEN version::numeric
          END
        ), 0) + 1)::text AS next_version
      FROM releases
      WHERE project_id = $1
    `,
    [projectId, CONTRACT_LIMITS.releaseVersion],
  );
  const row = result.rows[0];
  if (
    !row ||
    row.invalid_versions ||
    row.next_version.length > CONTRACT_LIMITS.releaseVersion
  ) {
    throw new Error("Cannot determine the next release version.");
  }
  return row.next_version;
}

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

  return mapReleaseRow(result.rows[0]!);
}

export async function findReleaseById(
  database: Queryable,
  releaseId: string,
): Promise<Release | null> {
  const result = await database.query<ReleaseRow>(
    `
      SELECT id, project_id, version, status, created_at, published_at
      FROM releases
      WHERE id = $1
    `,
    [releaseId],
  );

  const row = result.rows[0];

  return row ? mapReleaseRow(row) : null;
}

export async function listPublishedReleasesByProjectId(
  database: Queryable,
  projectId: string,
): Promise<Release[]> {
  const result = await database.query<ReleaseRow>(
    `
      SELECT id, project_id, version, status, created_at, published_at
      FROM releases
      WHERE project_id = $1
        AND status = 'published'
      ORDER BY published_at DESC, id
    `,
    [projectId],
  );

  return result.rows.map(mapReleaseRow);
}

export async function updateReleasesStatus(
  database: Queryable,
  releaseId: string,
  projectId: string,
  status: ReleaseStatus,
  publishedAt: string | null,
): Promise<Release | null> {
  const result = await database.query<ReleaseRow>(
    `
      UPDATE releases
      SET status = $1,
          published_at = $2
      WHERE id = $3
        AND project_id = $4
      RETURNING id, project_id, version, status, created_at, published_at
    `,
    [status, publishedAt, releaseId, projectId],
  );

  const row = result.rows[0];

  return row ? mapReleaseRow(row) : null;
}

export async function findDraftReleaseForUpdate(
  database: Queryable,
  releaseId: string,
  projectId: string,
): Promise<Release | null> {
  const result = await database.query<ReleaseRow>(
    `
      SELECT
        id,
        project_id,
        version,
        status,
        created_at,
        published_at
      FROM releases
      WHERE id = $1
        AND project_id = $2
        AND status = 'draft'
      FOR UPDATE
    `,
    [releaseId, projectId],
  );

  const row = result.rows[0];

  return row ? mapReleaseRow(row) : null;
}
