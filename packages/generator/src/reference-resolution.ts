import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import type { Token, TokenReferenceSlot, TokenType } from "@repo/contracts/type";
import { isCategory } from "@repo/contracts/validation/enum";
import {
  assertUniqueCssVariables,
  deriveCssVariable,
} from "@repo/generator/css-variable";
import { TokenResolutionError } from "@repo/generator/errors";
import { buildTokenGraphIndex, type TokenGraphIndex } from "@repo/generator/token-graph";
import type { GeneratedToken, GeneratedTokenValue } from "@repo/generator/types";

function resolvePrimitiveAlias(
  index: TokenGraphIndex,
  token: Token,
  slot: TokenReferenceSlot,
): string | undefined {
  const reference = index.referencesByTokenAndSlot.get(token.id)?.get(slot);

  if (!reference) {
    return undefined;
  }

  const target = index.tokenById.get(reference.referencedTokenId);

  if (!target) {
    throw new TokenResolutionError(
      "missing-reference-target",
      `Token "${token.id}" has a missing reference target for slot "${slot}".`,
      {
        tokenId: token.id,
        slot,
        targetTokenId: reference.referencedTokenId,
      },
    );
  }

  const targetType = index.tokenTypeById.get(target.tokenTypeId);

  if (targetType?.kind !== "primitive") {
    throw new TokenResolutionError(
      "semantic-reference-chain",
      `Token "${token.id}" cannot reference a semantic token in slot "${slot}".`,
      {
        tokenId: token.id,
        slot,
        targetTokenId: target.id,
      },
    );
  }

  if (!targetType) {
    throw new TokenResolutionError(
      "missing-reference-target",
      `Reference target token "${target.id}" has no token type.`,
      { tokenId: token.id, slot, targetTokenId: target.id },
    );
  }

  const cssVar = deriveCssVariable(target, targetType);

  if (cssVar === null) {
    throw new TokenResolutionError(
      "missing-reference-css-var",
      `Reference target token "${target.id}" cannot produce a CSS variable name.`,
      { tokenId: token.id, slot, targetTokenId: target.id },
    );
  }

  return `var(${cssVar})`;
}

function withOptionalReference(
  result: Record<string, string>,
  slot: TokenReferenceSlot,
  value: string | undefined,
): void {
  if (value !== undefined) {
    result[slot] = value;
  }
}

function resolveValue(
  index: TokenGraphIndex,
  token: Token,
  kind: TokenType["kind"],
): GeneratedTokenValue {
  if (token.value.kind === "unresolved") {
    throw new TokenResolutionError(
      "unresolved-token",
      `Token "${token.id}" has an unresolved value.`,
      { tokenId: token.id },
    );
  }

  if (token.value.kind === "single") {
    if (kind === "primitive") {
      return token.value;
    }

    const referenceValue = resolvePrimitiveAlias(index, token, "value");

    return referenceValue === undefined
      ? token.value
      : { kind: "single", value: referenceValue };
  }

  if (token.value.kind === "modes") {
    const values: Record<string, string> = {};

    withOptionalReference(values, "light", resolvePrimitiveAlias(index, token, "light"));
    withOptionalReference(values, "dark", resolvePrimitiveAlias(index, token, "dark"));

    return { kind: "modes", ...values };
  }

  if (token.value.kind === "typography") {
    const values: Record<string, string> = {};

    withOptionalReference(
      values,
      "fontSize",
      resolvePrimitiveAlias(index, token, "fontSize"),
    );
    withOptionalReference(
      values,
      "fontWeight",
      resolvePrimitiveAlias(index, token, "fontWeight"),
    );
    withOptionalReference(
      values,
      "lineHeight",
      resolvePrimitiveAlias(index, token, "lineHeight"),
    );

    return { kind: "typography", ...values };
  }

  throw new TokenResolutionError(
    "invalid-token-value",
    `Token "${token.id}" has an unsupported value kind.`,
    { tokenId: token.id },
  );
}

function assertNoPrimitiveReferences(
  index: TokenGraphIndex,
  token: Token,
  kind: "primitive" | "semantic",
): void {
  if (kind === "primitive" && index.referencesByTokenAndSlot.has(token.id)) {
    throw new TokenResolutionError(
      "invalid-token-value",
      `Primitive token "${token.id}" cannot contain references.`,
      { tokenId: token.id },
    );
  }
}

export function resolveTokenReferences(
  release: PublishedReleaseResponse,
): readonly GeneratedToken[] {
  const index = buildTokenGraphIndex(release);
  assertUniqueCssVariables(release.tokens, index.tokenTypeById);

  for (const token of index.tokenById.values()) {
    if (token.value.kind === "unresolved") {
      throw new TokenResolutionError(
        "unresolved-token",
        `Token "${token.id}" has an unresolved value.`,
        { tokenId: token.id },
      );
    }
  }

  return [...index.tokenById.values()].map((token) => {
    const tokenType = index.tokenTypeById.get(token.tokenTypeId)!;

    if (!isCategory(tokenType.category)) {
      throw new TokenResolutionError(
        "invalid-token-category",
        `Token "${token.id}" has an unsupported category.`,
        { tokenId: token.id },
      );
    }

    assertNoPrimitiveReferences(index, token, tokenType.kind);

    return {
      id: token.id,
      name: token.name,
      // Release cssVar is legacy; all generated aliases use this derived value.
      cssVar: deriveCssVariable(token, tokenType),
      category: tokenType.category,
      type: tokenType.name,
      kind: tokenType.kind,
      value: resolveValue(index, token, tokenType.kind),
    };
  });
}
