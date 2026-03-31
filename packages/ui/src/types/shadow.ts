export type ShadowVariant =
  | "level-2"
  | "surface-lifted"
  | "surface-pressed"
  | "overlay-floating"
  | "overlay-menu";

export type ShadowClass = `shadow-${ShadowVariant}` | "shadow-none";
