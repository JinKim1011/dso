import type { TokenType } from "@repo/contracts/type";

export type TokenTypeHierarchyError = {
  code:
    | "duplicate-id"
    | "wrong-project"
    | "missing-parent"
    | "self-parent"
    | "cross-project-parent"
    | "cycle";
  tokenTypeId: string;
  parentTypeId?: string;
  message: string;
};

function indexTokenTypes(
  tokenTypes: readonly TokenType[],
  projectId: string,
  errors: TokenTypeHierarchyError[],
): Map<string, TokenType> {
  const tokenTypesById = new Map<string, TokenType>();

  for (const tokenType of tokenTypes) {
    if (tokenTypesById.has(tokenType.id)) {
      errors.push({
        code: "duplicate-id",
        tokenTypeId: tokenType.id,
        message: `Token type "${tokenType.id}" appears more than once.`,
      });
      continue;
    }

    tokenTypesById.set(tokenType.id, tokenType);

    if (tokenType.projectId !== projectId) {
      errors.push({
        code: "wrong-project",
        tokenTypeId: tokenType.id,
        message: `Token type "${tokenType.id}" belongs to another project.`,
      });
    }
  }

  return tokenTypesById;
}

function validateParentReferences(
  tokenTypes: readonly TokenType[],
  tokenTypesById: Map<string, TokenType>,
  errors: TokenTypeHierarchyError[],
): void {
  for (const tokenType of tokenTypes) {
    const parentTypeId = tokenType.parentTypeId;

    if (parentTypeId === null) {
      continue;
    }

    if (parentTypeId === tokenType.id) {
      errors.push({
        code: "self-parent",
        tokenTypeId: tokenType.id,
        parentTypeId,
        message: `Token type "${tokenType.id}" cannot be its own parent.`,
      });
      continue;
    }

    const parentType = tokenTypesById.get(parentTypeId);

    if (!parentType) {
      errors.push({
        code: "missing-parent",
        tokenTypeId: tokenType.id,
        parentTypeId,
        message: `Parent token type "${parentTypeId}" does not exist.`,
      });
      continue;
    }

    if (parentType.projectId !== tokenType.projectId) {
      errors.push({
        code: "cross-project-parent",
        tokenTypeId: tokenType.id,
        parentTypeId,
        message: `A token type cannot have a parent from another project.`,
      });
    }
  }
}

function detectCycles(
  tokenTypes: readonly TokenType[],
  tokenTypesById: Map<string, TokenType>,
  errors: TokenTypeHierarchyError[],
): void {
  const states = new Map<string, "visiting" | "visited">();

  function visitParentChain(tokenTypeId: string, path: string[]): void {
    const state = states.get(tokenTypeId);

    if (state === "visited") {
      return;
    }

    if (state === "visiting") {
      const cycleStart = path.indexOf(tokenTypeId);
      const cycle = [...path.slice(cycleStart), tokenTypeId];

      errors.push({
        code: "cycle",
        tokenTypeId,
        message: `Token type cycle detected: ${cycle.join("→")}.`,
      });

      return;
    }

    const tokenType = tokenTypesById.get(tokenTypeId);

    if (!tokenType || tokenType.parentTypeId === null) {
      states.set(tokenTypeId, "visited");
      return;
    }

    if (tokenType.parentTypeId === tokenType.id) {
      states.set(tokenTypeId, "visited");
      return;
    }

    states.set(tokenTypeId, "visiting");

    const parentType = tokenTypesById.get(tokenType.parentTypeId);

    if (parentType) {
      visitParentChain(parentType.id, [...path, tokenTypeId]);
    }

    states.set(tokenTypeId, "visited");
  }

  for (const tokenType of tokenTypes) {
    visitParentChain(tokenType.id, []);
  }
}

export function validateTokenTypeHierarchy(
  tokenTypes: readonly TokenType[],
  projectId: string,
): TokenTypeHierarchyError[] {
  const errors: TokenTypeHierarchyError[] = [];
  const tokenTypesById = indexTokenTypes(tokenTypes, projectId, errors);

  validateParentReferences(tokenTypes, tokenTypesById, errors);
  detectCycles(tokenTypes, tokenTypesById, errors);

  return errors;
}
