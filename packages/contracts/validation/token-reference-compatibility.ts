import type { Token, TokenReferenceSlot, TokenType } from "@repo/contracts/type";

function isModeSlot(slot: TokenReferenceSlot): slot is "light" | "dark" {
  return slot === "light" || slot === "dark";
}

function supportsSingleValue(token: Token): boolean {
  return token.value.kind === "single";
}

const typographyPrimitiveNameBySlot = {
  fontSize: "font-size",
  fontWeight: "font-weight",
  lineHeight: "line-height",
} as const;

type TypographySlot = keyof typeof typographyPrimitiveNameBySlot;

function isTypographySlot(slot: TokenReferenceSlot): slot is TypographySlot {
  return slot === "fontSize" || slot === "fontWeight" || slot === "lineHeight";
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
      isModeSlot(slot) &&
      referencedType.category === "color" &&
      supportsSingleValue(referencedToken)
    );
  }
  if (referencingType.category === "shadow") {
    return (
      isModeSlot(slot) &&
      referencedType.category === "shadow" &&
      supportsSingleValue(referencedToken)
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
    if (!isTypographySlot(slot)) {
      return false;
    }

    const expectedName = typographyPrimitiveNameBySlot[slot];

    return (
      referencedType.category === "typography" &&
      referencedType.name === expectedName && // intended to be the stable type identifier, not a user-editable display label.
      supportsSingleValue(referencedToken)
    );
  }

  return false;
}
