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
    if (value && /\bvar\s*\(/i.test(value)) {
      throw new Error(`Missing reference for token "${token.id}" and slot "${slot}".`);
    }

    return value;
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

  const match = value?.match(/^\s*var\(\s*(--[^\s(),]+)\s*\)\s*$/);

  if (!target.cssVar || match?.[1] !== target.cssVar) {
    throw new Error(
      `Value and reference disagree for token "${token.id}" and slot "${slot}".`,
    );
  }

  if (/\bvar\s*\(/i.test(target.value.value)) {
    throw new Error(
      `Referenced token "${target.id}" has an unresolved value for token "${token.id}" and slot "${slot}".`,
    );
  }

  return target.value.value;
}

export function resolveTypographyToken(
  token: Token,
  tokenType: TokenType,
  referenceLookup: TokenReferenceLookup,
): { fontSize: string; fontWeight: string; lineHeight: string } {
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

  function resolve(slot: "fontSize" | "fontWeight" | "lineHeight", value: string) {
    const resolved = resolveTokenReferenceValue(
      token,
      tokenType,
      slot,
      value,
      referenceLookup,
    );
    if (resolved === undefined) {
      throw new Error(`Missing value for token "${token.id}" and slot "${slot}".`);
    }
    return resolved;
  }

  return {
    fontSize: resolve("fontSize", fontSize),
    fontWeight: resolve("fontWeight", fontWeight),
    lineHeight: resolve("lineHeight", lineHeight),
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
