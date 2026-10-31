import type { TokenReference, TokenReferenceSlot } from "@repo/contracts/type";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type TokenReferenceRow = QueryResultRow & {
  referencing_token_id: string;
  referenced_token_id: string;
  project_id: string;
  slot: TokenReferenceSlot;
};

function mapTokenReferenceRow(row: TokenReferenceRow): TokenReference {
  return {
    referencingTokenId: row.referencing_token_id,
    referencedTokenId: row.referenced_token_id,
    projectId: row.project_id,
    slot: row.slot,
  };
}

export async function insertTokenReference(
  database: Queryable,
  tokenReference: TokenReference,
): Promise<TokenReference> {
  const result = await database.query<TokenReferenceRow>(
    `
      INSERT INTO token_references (referencing_token_id, referenced_token_id, project_id, slot)
      VALUES ($1, $2, $3, $4)
      RETURNING referencing_token_id, referenced_token_id, project_id, slot
    `,
    [
      tokenReference.referencingTokenId,
      tokenReference.referencedTokenId,
      tokenReference.projectId,
      tokenReference.slot,
    ],
  );

  return mapTokenReferenceRow(result.rows[0]);
}

export async function listTokenReferencesByProjectId(
  database: Queryable,
  projectId: string,
): Promise<TokenReference[]> {
  const result = await database.query<TokenReferenceRow>(
    `
      SELECT referencing_token_id, referenced_token_id, project_id, slot
      FROM token_references
      WHERE project_id = $1
      ORDER BY referencing_token_id, referenced_token_id, slot
    `,
    [projectId],
  );

  return result.rows.map(mapTokenReferenceRow);
}

export async function listTokenReferencesToToken(
  database: Queryable,
  projectId: string,
  referencedTokenId: string,
): Promise<TokenReference[]> {
  const result = await database.query<TokenReferenceRow>(
    `
      SELECT referencing_token_id, referenced_token_id, project_id, slot
      FROM token_references
      WHERE project_id = $1
        AND referenced_token_id = $2
      ORDER BY referencing_token_id, slot
    `,
    [projectId, referencedTokenId],
  );

  return result.rows.map(mapTokenReferenceRow);
}
