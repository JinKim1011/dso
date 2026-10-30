import type { Token, TokenValue } from "@repo/contracts/type";

type TokenRow = {
  id: string;
  project_id: string;
  token_type_id: string;
  name: string;
  css_var: string | null;
  value: TokenValue;
};

export function mapTokenRow(row: TokenRow): Token {
  return {
    id: row.id,
    projectId: row.project_id,
    tokenTypeId: row.token_type_id,
    name: row.name,
    cssVar: row.css_var,
    value: row.value,
  };
}
