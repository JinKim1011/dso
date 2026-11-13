import type { Token, TokenValue } from "@repo/contracts/type";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type TokenRow = QueryResultRow & {
  id: string;
  project_id: string;
  token_type_id: string;
  name: string;
  css_var: string | null;
  value: TokenValue;
};

type TokenUpdate =
  { name: string; value?: TokenValue } | { name?: string; value: TokenValue };

function mapTokenRow(row: TokenRow): Token {
  return {
    id: row.id,
    projectId: row.project_id,
    tokenTypeId: row.token_type_id,
    name: row.name,
    cssVar: row.css_var ?? null,
    value: row.value,
  };
}

export async function insertToken(database: Queryable, token: Token): Promise<Token> {
  const result = await database.query<TokenRow>(
    `
      INSERT INTO tokens (id, project_id, token_type_id, name, css_var, value)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, project_id, token_type_id, name, css_var, value
    `,
    [token.id, token.projectId, token.tokenTypeId, token.name, token.cssVar, token.value],
  );

  return mapTokenRow(result.rows[0]!);
}

export async function listTokensByProjectId(
  database: Queryable,
  projectId: string,
): Promise<Token[]> {
  const result = await database.query<TokenRow>(
    `
      SELECT id, project_id, token_type_id, name, css_var, value
      FROM tokens
      WHERE project_id = $1
      ORDER BY id
    `,
    [projectId],
  );

  return result.rows.map(mapTokenRow);
}

export async function updateToken(
  database: Queryable,
  projectId: string,
  tokenId: string,
  update: TokenUpdate,
): Promise<Token | null> {
  const result = await database.query<TokenRow>(
    `
      UPDATE tokens
      SET name = COALESCE($1::text, name),
          value = COALESCE($2::jsonb, value)
      WHERE project_id = $3
        AND id = $4
      RETURNING id, project_id, token_type_id, name, css_var, value
    `,
    [
      update.name ?? null,
      update.value === undefined ? null : JSON.stringify(update.value),
      projectId,
      tokenId,
    ],
  );

  const row = result.rows[0];
  return row ? mapTokenRow(row) : null;
}
