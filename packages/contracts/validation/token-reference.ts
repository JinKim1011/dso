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

function supportedSlotsForCategory(category: string): readonly TokenReferenceSlot[] {
  switch (category) {
    case "color":
    case "shadow":
      return ["light", "dark"];

    case "typography":
      return ["fontSize", "fontWeight", "lineHeight"];

    case "spacing":
    case "radius":
    case "motion":
      return ["value"];

    default:
      return [];
  }
}

function isTypographySlot(
  slot: TokenReferenceSlot,
): slot is "fontSize" | "fontWeight" | "lineHeight" {
  return ["fontSize", "fontWeight", "lineHeight"].includes(slot);
}

function supportsSlot(
  token: Token,
  tokenType: TokenType,
  slot: TokenReferenceSlot,
): boolean {
  const categorySlots = supportedSlotsForCategory(tokenType.category);

  if (!categorySlots.includes(slot as TokenReferenceSlot)) {
    return false;
  }

  if (tokenType.category === "color") {
    return (
      token.value.kind === "modes" &&
      typeof token.value[slot as "light" | "dark"] === "string"
    );
  }

  if (tokenType.category === "typography") {
    return (
      token.value.kind === "typography" &&
      isTypographySlot(slot) &&
      typeof token.value[slot] === "string"
    );
  }

  return token.value.kind === "scalar";
}

export function validateTokenReference(
  reference: TokenReference,
  tokens: readonly Token[],
  tokenTypes: readonly TokenType[],
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

  const tokenTypeById = new Map(tokenTypes.map((tokenType) => [tokenType.id, tokenType]));

  const referencingTokenType = tokenTypeById.get(referencingToken.tokenTypeId);

  if (!referencingTokenType) {
    errors.push({
      code: "missing-referencing-token-type",
      message: `Token type "${referencingToken.tokenTypeId}" does not exist.`,
    });

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

  const validSlots: readonly TokenReferenceSlot[] = [
    "value",
    "light",
    "dark",
    "fontSize",
    "fontWeight",
    "lineHeight",
  ];

  const slot = reference.slot ?? "value";

  if (!validSlots.includes(slot)) {
    errors.push({
      code: "invalid-slot",
      message: `Reference slot "${slot}" is not supported.`,
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
