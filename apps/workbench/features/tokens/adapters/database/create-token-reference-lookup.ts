import type {
  Token,
  TokenReference,
  TokenReferenceSlot,
  TokenType,
} from "@repo/contracts/type";

type ReferenceLookupResult =
  { kind: "found"; token: Token; tokenType: TokenType } | { kind: "not-found" };

export type TokenReferenceLookup = {
  find: (referencingTokenId: string, slot: TokenReferenceSlot) => ReferenceLookupResult;
};

export function createTokenReferenceLookup(
  tokenTypes: readonly TokenType[],
  tokens: readonly Token[],
  references: readonly TokenReference[],
): TokenReferenceLookup {
  const tokenById = new Map(tokens.map((token) => [token.id, token]));

  const tokenTypeById = new Map(tokenTypes.map((tokenType) => [tokenType.id, tokenType]));

  const referencesByTokenAndSlot = new Map<
    string,
    Map<TokenReferenceSlot, TokenReference>
  >();

  for (const reference of references) {
    let referencesBySlot = referencesByTokenAndSlot.get(reference.referencingTokenId);

    if (!referencesBySlot) {
      referencesBySlot = new Map();
      referencesByTokenAndSlot.set(reference.referencingTokenId, referencesBySlot);
    }

    if (referencesBySlot.has(reference.slot)) {
      throw new Error(
        `Duplicate reference for token "${reference.referencingTokenId}" and slot "${reference.slot}".`,
      );
    }

    referencesBySlot.set(reference.slot, reference);
  }

  return {
    find(referencingTokenId, slot) {
      const reference = referencesByTokenAndSlot.get(referencingTokenId)?.get(slot);
      if (!reference) {
        return { kind: "not-found" };
      }

      const token = tokenById.get(reference.referencedTokenId);
      if (!token) {
        throw new Error(
          `Reference for token "${referencingTokenId}" and slot "${slot}" points to missing token "${reference.referencedTokenId}".`,
        );
      }

      const tokenType = tokenTypeById.get(token.tokenTypeId);
      if (!tokenType) {
        throw new Error(
          `Referenced token "${token.id}" has missing token type "${token.tokenTypeId}".`,
        );
      }

      return { kind: "found", token, tokenType };
    },
  };
}
