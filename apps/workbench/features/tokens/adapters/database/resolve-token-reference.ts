import type { TokenReferenceLookup } from "@/features/tokens/adapters/database/create-token-reference-lookup";
import type { Token, TokenReferenceSlot, TokenType } from "@repo/contracts/type";
import { isCompatibleReferencedType } from "@repo/contracts/validation/token-reference-compatibility";

function resolveTokenReferenceValue(
  token: Token,
  tokenType: TokenType,
  slot: TokenReferenceSlot,
  value: string | undefined,
  referenceLookup: TokenReferenceLookup,
): string | undefined {
  const result = referenceLookup.find(token.id, slot);

  if (result.kind === "not-found") {
    return undefined;
  }

  const target = result.token;

  const targetType = result.tokenType;

  if (
    target.projectId !== token.projectId ||
    targetType.projectId !== token.projectId ||
    !isCompatibleReferencedType(target, tokenType, targetType, slot) ||
    target.value.kind !== "single"
  ) {
    throw new Error(`Invalid reference for token "${token.id}" and slot "${slot}".`);
  }

  return target.value.value;
}

export function resolveTypographyToken(
  token: Token,
  tokenType: TokenType,
  referenceLookup: TokenReferenceLookup,
): {
  fontSize: string | undefined;
  fontWeight: string | undefined;
  lineHeight: string | undefined;
} {
  if (
    token.value.kind !== "typography" ||
    token.tokenTypeId !== tokenType.id ||
    token.projectId !== tokenType.projectId ||
    tokenType.kind !== "semantic" ||
    tokenType.category !== "typography"
  ) {
    throw new Error(`Token "${token.id}" is not a semantic typography token.`);
  }

  const { fontSize, fontWeight, lineHeight } = token.value;

  return {
    fontSize: resolveTokenReferenceValue(
      token,
      tokenType,
      "fontSize",
      fontSize,
      referenceLookup,
    ),
    fontWeight: resolveTokenReferenceValue(
      token,
      tokenType,
      "fontWeight",
      fontWeight,
      referenceLookup,
    ),
    lineHeight: resolveTokenReferenceValue(
      token,
      tokenType,
      "lineHeight",
      lineHeight,
      referenceLookup,
    ),
  };
}

export function resolveModeToken(
  token: Token,
  tokenType: TokenType,
  referenceLookup: TokenReferenceLookup,
): { light: string | undefined; dark: string | undefined } {
  if (
    token.value.kind !== "modes" ||
    token.tokenTypeId !== tokenType.id ||
    token.projectId !== tokenType.projectId ||
    tokenType.kind !== "semantic" ||
    (tokenType.category !== "color" && tokenType.category !== "shadow")
  ) {
    throw new Error(`Token "${token.id}" is not a semantic mode token.`);
  }

  return {
    light: resolveTokenReferenceValue(
      token,
      tokenType,
      "light",
      token.value.light,
      referenceLookup,
    ),
    dark: resolveTokenReferenceValue(
      token,
      tokenType,
      "dark",
      token.value.dark,
      referenceLookup,
    ),
  };
}
