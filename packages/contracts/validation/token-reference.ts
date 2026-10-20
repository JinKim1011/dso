import { Token, TokenReference, TokenValue } from "@repo/contracts/type";

export type TokenReferenceValidationError = {
  code:
    | "missing-referencing-token"
    | "missing-referenced-token"
    | "wrong-project"
    | "self-reference"
    | "invalid-mode"
    | "unsupported-mode";
  message: string;
};

function supportsMode(value: TokenValue, mode: string): boolean {
  if (mode === "default") {
    return value.kind !== "modes";
  }

  if (value.kind !== "modes") {
    return false;
  }

  return typeof value[mode as "light" | "dark"] === "string";
}

export function validateTokenReference(
  reference: TokenReference,
  tokens: readonly Token[],
  projectId: string,
): TokenReferenceValidationError[] {
  const errors: TokenReferenceValidationError[] = [];

  const tokenById = new Map(tokens.map((token) => [token.id, token]));

  const referencedToken = tokenById.get(reference.referencedTokenId);

  if (!referencedToken) {
    errors.push({
      code: "missing-referenced-token",
      message: `Referenced token "${reference.referencedTokenId}" deos not exist.`,
    });
  }

  const referencingToken = tokenById.get(reference.referencingTokenId);

  if (!referencingToken) {
    errors.push({
      code: "missing-referencing-token",
      message: `Referencing token "${reference.referencingTokenId}" does not exist.`,
    });
  }

  if (!referencedToken || !referencingToken) {
    return errors;
  }

  if (
    referencedToken.projectId !== projectId ||
    referencingToken.projectId !== projectId
  ) {
    errors.push({
      code: "wrong-project",
      message: "Both tokens must belong to the requested project.",
    });
  }

  if (reference.referencedTokenId === reference.referencingTokenId) {
    errors.push({
      code: "self-reference",
      message: "A token cannot reference itself.",
    });
  }

  const mode = reference.mode ?? "default";

  if (!["default", "light", "dark"].includes(mode)) {
    errors.push({
      code: "invalid-mode",
      message: `Reference mode "${mode}" is not supported.`,
    });

    return errors;
  }

  if (!supportsMode(referencingToken.value, mode)) {
    errors.push({
      code: "unsupported-mode",
      message: `The referencing token does not support the "${mode}" mode.`,
    });
  }

  return errors;
}
