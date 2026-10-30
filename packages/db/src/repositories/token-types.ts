import type { TokenType } from "@repo/contracts/type";
import type { TokenKind } from "@repo/contracts/validation/enum";

type TokenTypeRow = {
  id: string;
  project_id: string;
  parent_type_id: string | null;
  category: string;
  name: string;
  kind: TokenKind;
};

export function mapTokenTypeRow(row: TokenTypeRow): TokenType {
  return {
    id: row.id,
    projectId: row.project_id,
    parentTypeId: row.parent_type_id,
    category: row.category,
    name: row.name,
    kind: row.kind,
  };
}
