import type { Token, TokenReferenceSlot, TokenType } from "@repo/contracts/type";

export const tokenReferenceSlots: readonly TokenReferenceSlot[] = [
  "value",
  "light",
  "dark",
  "fontSize",
  "fontWeight",
  "lineHeight",
];

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

export function supportsTokenReferenceSlot(
  token: Token,
  tokenType: TokenType,
  slot: TokenReferenceSlot,
): boolean {
  const categorySlots = supportedSlotsForCategory(tokenType.category);

  if (!categorySlots.includes(slot as TokenReferenceSlot)) {
    return false;
  }

  if (tokenType.category === "color" || tokenType.category === "shadow") {
    return (
      tokenType.kind === "semantic" &&
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

  return token.value.kind === "single";
}
