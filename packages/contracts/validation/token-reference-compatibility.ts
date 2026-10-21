import type { Token, TokenReferenceSlot, TokenType } from "@repo/contracts/type";

function isModeSlot(slot: TokenReferenceSlot): slot is "light" | "dark" {
  return slot === "light" || slot === "dark";
}

function supportsSingleValue(token: Token): boolean {
  return token.value.kind === "single";
}

export function isCompatibleReferencedType(
  referencedToken: Token,
  referencingType: TokenType,
  referencedType: TokenType,
  slot: TokenReferenceSlot,
): boolean {
  if (referencedType.kind !== "primitive") {
    return false;
  }

  if (referencingType.category === "color") {
    return (
      referencedType.category === "color" && supportsModeValue(referencedToken, slot)
    );
  }
  if (referencingType.category === "shadow") {
    return (
      referencedType.category === "shadow" && supportsModeValue(referencedToken, slot)
    );
  }
  if (referencingType.category === "spacing") {
    return (
      slot === "value" &&
      referencedType.category === "spacing" &&
      supportsSingleValue(referencedToken)
    );
  }
  if (referencingType.category === "radius") {
    return (
      slot === "value" &&
      referencedType.category === "radius" &&
      supportsSingleValue(referencedToken)
    );
  }

  if (referencingType.category === "motion") {
    return (
      slot === "value" &&
      referencedType.category === "motion" &&
      supportsSingleValue(referencedToken)
    );
  }

  if (referencingType.category === "typography") {
    if (slot === "fontSize") {
      return (
        referencedType.category === "typography" &&
        referencedType.name === "fontSize" &&
        supportsSingleValue(referencedToken)
      );
    }

    if (slot === "fontWeight") {
      return (
        referencedType.category === "typography" &&
        referencedType.name === "fontWeight" &&
        supportsSingleValue(referencedToken)
      );
    }

    if (slot === "lineHeight") {
      return (
        referencedType.category === "typography" &&
        referencedType.name === "lineHeight" &&
        supportsSingleValue(referencedToken)
      );
    }
  }

  return false;
}
