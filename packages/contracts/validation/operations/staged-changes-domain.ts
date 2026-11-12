import type { SaveStagedChangesRequest } from "@repo/contracts/operation";
import type {
  Token,
  TokenReference,
  TokenReferenceSlot,
  TokenType,
  TokenValue,
} from "@repo/contracts/type";
import {
  type TokenReferenceValidationError,
  validateTokenReference,
} from "@repo/contracts/validation/token-reference";
import { supportsTokenReferenceSlot } from "@repo/contracts/validation/token-reference-slots";
import {
  expectedValueKind,
  validateTokenValue,
} from "@repo/contracts/validation/token-value";

export type StagedChangesDomainIssue = {
  code:
    | "missing-token"
    | "wrong-project"
    | "missing-token-type"
    | "conflict"
    | "invalid-value"
    | "unsupported-slot"
    | "duplicate-reference"
    | TokenReferenceValidationError["code"];
  tokenId: string;
  referencedTokenId?: string;
  field: string;
  message: string;
};

export type StagedChangesDomainResult =
  | { success: true; tokens: Token[]; references: TokenReference[] }
  | { success: false; issues: StagedChangesDomainIssue[] };

function referenceKey(tokenId: string, slot: TokenReferenceSlot): string {
  return JSON.stringify([tokenId.toLowerCase(), slot]);
}

function sameValue(left: TokenValue, right: TokenValue): boolean {
  if (left.kind !== right.kind) return false;

  switch (left.kind) {
    case "single":
      return right.kind === "single" && left.value === right.value;
    case "modes":
      return (
        right.kind === "modes" && left.light === right.light && left.dark === right.dark
      );
    case "typography":
      return (
        right.kind === "typography" &&
        left.fontSize === right.fontSize &&
        left.fontWeight === right.fontWeight &&
        left.lineHeight === right.lineHeight
      );
    case "unresolved":
      return right.kind === "unresolved";
  }
}

function sameId(left: string | null, right: string | null): boolean {
  return left?.toLowerCase() === right?.toLowerCase();
}

function applyChanges(
  request: SaveStagedChangesRequest,
  tokenById: Map<string, Token>,
  currentReferences: Map<string, TokenReference>,
  projectId: string,
): { tokens: Map<string, Token>; references: TokenReference[] } {
  const proposedTokens = new Map(tokenById);
  const proposedReferences = new Map(currentReferences);

  for (const change of request.changes) {
    const token = proposedTokens.get(change.tokenId.toLowerCase())!;
    const updated: Token = {
      ...token,
      ...(change.name && { name: change.name.after }),
      ...(change.value && { value: change.value.after }),
    };
    proposedTokens.set(token.id.toLowerCase(), updated);

    for (const reference of change.references) {
      const key = referenceKey(token.id, reference.slot);
      if (reference.afterTokenId === null) {
        proposedReferences.delete(key);
        continue;
      }

      const target = tokenById.get(reference.afterTokenId.toLowerCase());
      proposedReferences.set(key, {
        projectId,
        referencingTokenId: token.id,
        referencedTokenId: target?.id ?? reference.afterTokenId.toLowerCase(),
        slot: reference.slot,
      });
    }
  }

  return {
    tokens: proposedTokens,
    references: Array.from(proposedReferences.values()),
  };
}

export function validateSaveStagedChanges(
  request: SaveStagedChangesRequest,
  tokens: readonly Token[],
  tokenTypes: readonly TokenType[],
  references: readonly TokenReference[],
): StagedChangesDomainResult {
  const issues: StagedChangesDomainIssue[] = [];
  const projectId = request.projectId.toLowerCase();
  const tokenById = new Map(tokens.map((token) => [token.id.toLowerCase(), token]));
  const typeById = new Map(tokenTypes.map((type) => [type.id.toLowerCase(), type]));
  const currentReferences = new Map<string, TokenReference>();

  for (const reference of references) {
    const key = referenceKey(reference.referencingTokenId, reference.slot);
    if (currentReferences.has(key)) {
      issues.push({
        code: "duplicate-reference",
        tokenId: reference.referencingTokenId,
        field: `references.${reference.slot}`,
        message: `Multiple references exist for slot "${reference.slot}".`,
      });
    }
    currentReferences.set(key, reference);
  }

  for (const change of request.changes) {
    const token = tokenById.get(change.tokenId.toLowerCase());
    if (!token) {
      issues.push({
        code: "missing-token",
        tokenId: change.tokenId,
        field: "tokenId",
        message: `Token "${change.tokenId}" does not exist in the project.`,
      });
      continue;
    }
    if (token.projectId.toLowerCase() !== projectId) {
      issues.push({
        code: "wrong-project",
        tokenId: change.tokenId,
        field: "tokenId",
        message: `Token "${change.tokenId}" does not belong to the requested project.`,
      });
      continue;
    }

    if (change.name && change.name.before !== token.name) {
      issues.push({
        code: "conflict",
        tokenId: token.id,
        field: "name",
        message: "Token name has changed.",
      });
    }
    if (change.value && !sameValue(change.value.before, token.value)) {
      issues.push({
        code: "conflict",
        tokenId: token.id,
        field: "value",
        message: "Token value has changed.",
      });
    }
    for (const reference of change.references) {
      const current = currentReferences.get(referenceKey(token.id, reference.slot));
      if (!sameId(reference.beforeTokenId, current?.referencedTokenId ?? null)) {
        issues.push({
          code: "conflict",
          tokenId: token.id,
          field: `references.${reference.slot}`,
          message: `Reference in slot "${reference.slot}" has changed.`,
        });
      }
    }
  }

  if (issues.length > 0) return { success: false, issues };

  const proposedState = applyChanges(request, tokenById, currentReferences, projectId);
  const finalTokens = Array.from(proposedState.tokens.values());
  const finalReferences = proposedState.references;

  for (const change of request.changes) {
    const token = proposedState.tokens.get(change.tokenId.toLowerCase())!;
    const tokenType = typeById.get(token.tokenTypeId.toLowerCase());
    if (!tokenType) {
      issues.push({
        code: "missing-token-type",
        tokenId: token.id,
        field: "tokenTypeId",
        message: `Token type "${token.tokenTypeId}" does not exist.`,
      });
      continue;
    }
    if (tokenType.projectId.toLowerCase() !== projectId) {
      issues.push({
        code: "wrong-project",
        tokenId: token.id,
        field: "tokenTypeId",
        message: `Token type "${token.tokenTypeId}" does not belong to the requested project.`,
      });
      continue;
    }

    if (change.value) {
      for (const issue of validateTokenValue(token.value)) {
        issues.push({
          code: "invalid-value",
          tokenId: token.id,
          field: issue.field,
          message: issue.message,
        });
      }
      const expectedKind = expectedValueKind(tokenType);
      if (expectedKind && token.value.kind !== expectedKind) {
        issues.push({
          code: "invalid-value",
          tokenId: token.id,
          field: "value.kind",
          message: `Token type "${tokenType.id}" requires value kind "${expectedKind}".`,
        });
      }
    }

    for (const reference of change.references) {
      if (
        reference.afterTokenId === null &&
        !currentReferences.has(referenceKey(token.id, reference.slot)) &&
        (tokenType.kind === "primitive" ||
          !supportsTokenReferenceSlot(token, tokenType, reference.slot))
      ) {
        issues.push({
          code: "unsupported-slot",
          tokenId: token.id,
          field: `references.${reference.slot}`,
          message: `Token does not support the "${reference.slot}" slot.`,
        });
      }
    }
  }

  for (const reference of finalReferences) {
    for (const issue of validateTokenReference(
      reference,
      finalTokens,
      tokenTypes,
      projectId,
    )) {
      issues.push({
        ...issue,
        tokenId: reference.referencingTokenId,
        referencedTokenId: reference.referencedTokenId,
        field: `references.${reference.slot}`,
      });
    }
  }

  if (issues.length > 0) return { success: false, issues };
  return { success: true, tokens: finalTokens, references: finalReferences };
}
