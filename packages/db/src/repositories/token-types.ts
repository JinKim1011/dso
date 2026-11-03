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

  return mapTokenTypeRow(result.rows[0]!);
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

export async function listTokenTypeHierarchy(
  database: Queryable,
  projectId: string,
): Promise<TokenType[]> {
  const result = await database.query<TokenTypeRow>(
    `
      WITH RECURSIVE hierarchy AS (
        SELECT id, project_id, parent_type_id, category, name, kind, 0 AS depth
        FROM token_types
        WHERE project_id = $1
          AND parent_type_id IS NULL

        UNION ALL

        SELECT child.id,
               child.project_id,
               child.parent_type_id,
               child.category,
               child.name,
               child.kind,
               parent.depth + 1
        FROM token_types child
        JOIN hierarchy parent
          ON child.parent_type_id = parent.id
        WHERE child.project_id = $1
      )
      SELECT id, project_id, parent_type_id, category, name, kind
      FROM hierarchy
      ORDER BY id
    `,
    [projectId],
  );

  return result.rows.map(mapTokenTypeRow);
}

export async function updateTokenTypeParent(
  database: Queryable,
  tokenTypeId: string,
  projectId: string,
  parentTypeId: string | null,
): Promise<TokenType | null> {
  const result = await database.query<TokenTypeRow>(
    `
      UPDATE token_types
      SET parent_type_id = $1
      WHERE id = $2
        AND project_id = $3
      RETURNING id, project_id, parent_type_id, category, name, kind
    `,
    [parentTypeId, tokenTypeId, projectId],
  );

  const row = result.rows[0];

  return row ? mapTokenTypeRow(row) : null;
}
