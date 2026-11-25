import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import type { Token, TokenType } from "@repo/contracts/type";
import {
  findTokenCssVariableConflicts,
  validateTokenName,
} from "@repo/contracts/validation/token-naming";

type ValidateTokenNameChangeInput = {
  draftModel: TokenGraphViewModel;
  row: TokenValueViewModel;
  tokenTypeId: string;
  originalName: string;
  nextName: string;
  projectId?: string;
};

function tokenTypesFromModel(model: TokenGraphViewModel, projectId: string): TokenType[] {
  return model.tokenTypes.map((type) => ({
    id: type.id,
    projectId,
    parentTypeId: type.parentTypeId,
    category: type.category,
    name: type.type,
    kind: type.kind,
  }));
}

function tokensFromModel(
  model: TokenGraphViewModel,
  projectId: string,
  rowId: string,
  nextName: string,
): Token[] {
  return model.tokenTypes.flatMap((type) =>
    type.values.map((row) => ({
      id: row.id,
      projectId,
      tokenTypeId: type.id,
      name: row.id === rowId ? nextName : row.name,
      cssVar: row.cssVar ?? null,
      value: row.value,
    })),
  );
}

export function validateTokenNameChange({
  draftModel,
  row,
  tokenTypeId,
  originalName,
  nextName,
  projectId = "00000000-0000-4000-8000-000000000000",
}: ValidateTokenNameChangeInput): string | null {
  if (nextName === originalName) return null;

  const formatError = validateTokenName(nextName);
  if (formatError) return formatError;

  const tokenTypes = tokenTypesFromModel(draftModel, projectId);
  const tokenTypesById = new Map(tokenTypes.map((type) => [type.id, type]));
  const tokenType = tokenTypesById.get(tokenTypeId);
  if (!tokenType) return "The token type could not be found.";

  const tokens = tokensFromModel(draftModel, projectId, row.id, nextName);
  const conflicts = findTokenCssVariableConflicts(tokens, tokenTypesById);
  const conflict = [...conflicts].find(([, tokenIds]) => tokenIds.includes(row.id));
  if (!conflict) return null;

  return "That name is already used. Try another name.";
}
