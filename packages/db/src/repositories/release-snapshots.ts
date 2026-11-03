import type { PublishedReleaseSnapshot } from "@repo/contracts/operation";
import { listComponentsByProjectId } from "@repo/db/repositories/components";
import { listTokenReferencesByProjectId } from "@repo/db/repositories/references";
import { listDocumentTemplatesByProjectId } from "@repo/db/repositories/templates";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { listTokensByProjectId } from "@repo/db/repositories/tokens";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type ReleaseSnapshotRow = QueryResultRow & {
  release_id: string;
  token_types: PublishedReleaseSnapshot["tokenTypes"];
  tokens: PublishedReleaseSnapshot["tokens"];
  references: PublishedReleaseSnapshot["references"];
  components: PublishedReleaseSnapshot["components"];
  templates: PublishedReleaseSnapshot["templates"];
};

export async function insertReleaseSnapshot(
  database: Queryable,
  releaseId: string,
  snapshot: PublishedReleaseSnapshot,
): Promise<void> {
  await database.query(
    `
      INSERT INTO release_snapshots (
        release_id,
        token_types,
        tokens,
        references,
        components,
        templates
      )
      VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb)
    `,
    [
      releaseId,
      JSON.stringify(snapshot.tokenTypes),
      JSON.stringify(snapshot.tokens),
      JSON.stringify(snapshot.references),
      JSON.stringify(snapshot.components),
      JSON.stringify(snapshot.templates),
    ],
  );
}

export async function findReleaseSnapshot(
  database: Queryable,
  releaseId: string,
): Promise<PublishedReleaseSnapshot | null> {
  const result = await database.query<ReleaseSnapshotRow>(
    `
      SELECT
        token_types,
        tokens,
        references,
        components,
        templates
      FROM release_snapshots
      WHERE release_id = $1
    `,
    [releaseId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    tokenTypes: row.token_types,
    tokens: row.tokens,
    references: row.references,
    components: row.components,
    templates: row.templates,
  };
}

export async function createReleaseSnapshot(
  database: Queryable,
  releaseId: string,
  projectId: string,
): Promise<void> {
  const [tokenTypes, tokens, references, components, templates] = await Promise.all([
    listTokenTypesByProjectId(database, projectId),
    listTokensByProjectId(database, projectId),
    listTokenReferencesByProjectId(database, projectId),
    listComponentsByProjectId(database, projectId),
    listDocumentTemplatesByProjectId(database, projectId),
  ]);

  await database.query(
    `
      INSERT INTO release_snapshots (
        release_id,
        token_types,
        tokens,
        "references",
        components,
        templates
      )
      VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb)
    `,
    [
      releaseId,
      JSON.stringify(tokenTypes),
      JSON.stringify(tokens),
      JSON.stringify(references),
      JSON.stringify(components),
      JSON.stringify(templates),
    ],
  );
}
