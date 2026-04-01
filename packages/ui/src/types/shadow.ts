export type LevelVariant = "1" | "2";

export type ShadowSurfaceVariant = "lifted" | "pressed";

export type OverlayVariant = "floating" | "menu";

export type ShadowClass =
  | `shadow-level-${LevelVariant}`
  | `shadow-surface-${ShadowSurfaceVariant}`
  | `shadow-overlay-${OverlayVariant}`;
