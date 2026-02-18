export type SurfaceVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "quaternary";
export type ContentVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "quaternary";
export type StrokeVariant = "primary" | "secondary" | "tertiary";

export type BgClass = `bg-surface-${SurfaceVariant}` | "bg-transparent";

export type TextColorClass = `text-content-${ContentVariant}` | "text-primary";

export type BorderClass =
  | `border-stroke-${StrokeVariant}`
  | "border-transparent";

export type HoverBgClass =
  | `hover:bg-surface-${SurfaceVariant}`
  | "hover:bg-transparent";
export type HoverTextColorClass =
  | `hover:text-content-${ContentVariant}`
  | "hover:text-primary";
export type HoverBorderClass =
  | `hover:border-stroke-${StrokeVariant}`
  | "hover:border-transparent";

export type ActiveBgClass =
  | `active:bg-surface-${SurfaceVariant}`
  | "active:bg-transparent";
export type ActiveTextColorClass =
  | `active:text-content-${ContentVariant}`
  | "active:text-primary";
export type ActiveBorderClass =
  | `active:border-stroke-${StrokeVariant}`
  | "active:border-transparent";
