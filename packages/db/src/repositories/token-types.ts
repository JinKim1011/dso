import type { TokenType } from "@repo/contracts/type";
import type { TokenKind } from "@repo/contracts/validation/enum";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type TokenTypeRow = QueryResultRow & {
  id: string;
  project_id: string;
  parent_type_id: string | null;
  category: string;
  name: string;
  kind: TokenKind;
};

function mapTokenTypeRow(row: TokenTypeRow): TokenType {
  return {
    id: row.id,
    projectId: row.project_id,
    parentTypeId: row.parent_type_id ?? null,
    category: row.category,
    name: row.name,
    kind: row.kind,
  };
}

export async function insertTokenType(
  database: Queryable,
  tokenType: TokenType,
): Promise<TokenType> {
  const result = await database.query<TokenTypeRow>(
    `
      INSERT INTO token_types (id, project_id, parent_type_id, category, name, kind)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, project_id, parent_type_id, category, name, kind
    `,
    [
      tokenType.id,
      tokenType.projectId,
      tokenType.parentTypeId,
      tokenType.category,
      tokenType.name,
      tokenType.kind,
    ],
  );

  return mapTokenTypeRow(result.rows[0]);
}

export async function listTokenTypesByProjectId(
  database: Queryable,
  projectId: string,
): Promise<TokenType[]> {
  const result = await database.query<TokenTypeRow>(
    `
      SELECT id, project_id, parent_type_id, category, name, kind
      FROM token_types
      WHERE project_id = $1
      ORDER BY id
    `,
    [projectId],
  );

  return result.rows.map(mapTokenTypeRow);
}
