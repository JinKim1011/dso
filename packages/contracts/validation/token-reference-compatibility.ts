import type { Token, TokenReferenceSlot, TokenType } from "@repo/contracts/type";

export function isCompatibleReferencedType(
  referencedToken: Token,
  referencingType: TokenType,
  referencedType: TokenType,
  slot: TokenReferenceSlot,
): boolean {
  if (referencedType.kind !== "primitive" || referencedToken.value.kind !== "scalar") {
    return false;
  }

  switch (referencingType.category) {
    case "color":
      return referencedType.category === "color";

    case "spacing":
      return slot === "value" && referencedType.category === "spacing";

    case "radius":
      return slot === "value" && referencedType.category === "radius";

    case "motion":
      return slot === "value" && referencedType.category === "motion";

    case "typography":
      if (slot === "fontSize") {
        return (
          referencedType.category === "typography" && referencedType.name === "fontSize"
        );
      }

      if (slot === "fontWeight") {
        return (
          referencedType.category === "typography" && referencedType.name === "fontWeight"
        );
      }

      if (slot === "lineHeight") {
        return (
          referencedType.category === "typography" && referencedType.name === "lineHeight"
        );
      }

      return false;

    default:
      return false;
  }
}
