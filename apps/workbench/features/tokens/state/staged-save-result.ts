import { createTokenReferenceLookup } from "@/features/tokens/adapters/database/create-token-reference-lookup";
import { mapTokenValue } from "@/features/tokens/adapters/database/map-token-value";
import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import { findRowById } from "@/features/tokens/state/staged-graph-model";
import type { SaveStagedChangesRequest } from "@repo/contracts/operation";
import type {
  Token,
  TokenReference,
  TokenReferenceSlot,
  TokenType,
} from "@repo/contracts/type";
import { isRecord } from "@repo/contracts/validation/operations/common";
import { tokenReferenceSlots } from "@repo/contracts/validation/token-reference-slots";
import { validateTokenValue } from "@repo/contracts/validation/token-value";

type SavedRows = { tokens: Token[]; references: TokenReference[] };

function isToken(value: unknown): value is Token {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.tokenTypeId === "string" &&
    typeof value.name === "string" &&
    (typeof value.cssVar === "string" || value.cssVar === null) &&
    validateTokenValue(value.value).length === 0
  );
}

function isReference(value: unknown): value is TokenReference {
  return (
    isRecord(value) &&
    typeof value.projectId === "string" &&
    typeof value.referencingTokenId === "string" &&
    typeof value.referencedTokenId === "string" &&
    tokenReferenceSlots.some((slot) => slot === value.slot)
  );
}

export function parseSavedRows(
  input: unknown,
  request: SaveStagedChangesRequest,
  base: TokenGraphViewModel,
): SavedRows {
  if (
    !isRecord(input) ||
    input.ok !== true ||
    !Array.isArray(input.tokens) ||
    !input.tokens.every(isToken) ||
    !Array.isArray(input.references) ||
    !input.references.every(isReference)
  ) {
    throw new Error("Invalid save response.");
  }
  const expected = new Set(request.changes.map((change) => change.tokenId.toLowerCase()));
  const ids = new Set<string>();
  const types = new Map(
    base.tokenTypes.flatMap((type) =>
      type.values.map((row) => [row.id.toLowerCase(), type.id]),
    ),
  );
  for (const token of input.tokens) {
    const id = token.id.toLowerCase();
    if (
      !expected.has(id) ||
      ids.has(id) ||
      token.projectId.toLowerCase() !== request.projectId.toLowerCase() ||
      token.tokenTypeId.toLowerCase() !== types.get(id)?.toLowerCase()
    ) {
      throw new Error("Unexpected token in save response.");
    }
    ids.add(id);
  }
  if (ids.size !== expected.size) throw new Error("Incomplete save response.");
  const slots = new Set<string>();
  for (const reference of input.references) {
    const key = `${reference.referencingTokenId.toLowerCase()}:${reference.slot}`;
    if (
      !expected.has(reference.referencingTokenId.toLowerCase()) ||
      reference.projectId.toLowerCase() !== request.projectId.toLowerCase() ||
      !types.has(reference.referencedTokenId.toLowerCase()) ||
      slots.has(key)
    ) {
      throw new Error("Unexpected reference in save response.");
    }
    slots.add(key);
  }
  return { tokens: input.tokens, references: input.references };
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function reconcileSavedRows(
  base: TokenGraphViewModel,
  draft: TokenGraphViewModel,
  submitted: TokenGraphViewModel,
  projectId: string,
  result: SavedRows,
): { baseModel: TokenGraphViewModel; draftModel: TokenGraphViewModel } {
  const saved = new Map(result.tokens.map((token) => [token.id.toLowerCase(), token]));
  const savedIds = new Set(saved.keys());
  const types: TokenType[] = base.tokenTypes.map((type) => ({
    id: type.id,
    projectId,
    parentTypeId: null,
    category: type.category,
    name: type.type,
    kind: type.kind,
  }));
  const tokens: Token[] = base.tokenTypes.flatMap((type) =>
    type.values.map(
      (row) =>
        saved.get(row.id.toLowerCase()) ?? {
          id: row.id,
          projectId,
          tokenTypeId: type.id,
          name: row.name,
          cssVar: row.cssVar ?? null,
          value: row.value,
        },
    ),
  );
  const references: TokenReference[] = base.tokenTypes.flatMap((type) =>
    type.values.flatMap((row) =>
      savedIds.has(row.id.toLowerCase())
        ? []
        : tokenReferenceSlots.flatMap((slot) => {
            const target = row.references?.[slot];
            return target
              ? [
                  {
                    projectId,
                    referencingTokenId: row.id,
                    referencedTokenId: target,
                    slot,
                  },
                ]
              : [];
          }),
    ),
  );
  references.push(...result.references);
  const lookup = createTokenReferenceLookup(types, tokens, references);
  const tokenById = new Map(tokens.map((token) => [token.id.toLowerCase(), token]));
  const typeById = new Map(types.map((type) => [type.id, type]));
  const baseModel: TokenGraphViewModel = {
    ...base,
    tokenTypes: base.tokenTypes.map((type) => ({
      ...type,
      values: type.values.map((row) => {
        const token = tokenById.get(row.id.toLowerCase())!;
        return {
          id: token.id,
          name: token.name,
          cssVar: token.cssVar ?? undefined,
          ...mapTokenValue(token, typeById.get(type.id)!, lookup),
        };
      }),
    })),
  };
  const draftModel: TokenGraphViewModel = {
    ...draft,
    tokenTypes: draft.tokenTypes.map((type) => ({
      ...type,
      values: type.values.map((current) => {
        if (!savedIds.has(current.id.toLowerCase())) return current;
        const sent = findRowById(submitted, current.id);
        const persisted = findRowById(baseModel, current.id);
        if (!sent || !persisted) throw new Error("Saved token is missing from draft.");
        const merged: TokenValueViewModel = {
          ...persisted,
          name: current.name === sent.name ? persisted.name : current.name,
          value: sameValue(current.value, sent.value) ? persisted.value : current.value,
        };
        const mergedReferences: Partial<Record<TokenReferenceSlot, string>> = {};
        for (const slot of tokenReferenceSlots) {
          const currentId = current.references?.[slot];
          const target =
            currentId === sent.references?.[slot]
              ? persisted.references?.[slot]
              : currentId;
          if (target !== undefined) mergedReferences[slot] = target;
        }
        merged.references = Object.keys(mergedReferences).length
          ? mergedReferences
          : undefined;
        return merged;
      }),
    })),
  };
  return { baseModel, draftModel };
}
