export type SurfaceVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "quaternary"
  | "quinary"
  | "accent"
  | "accentStrong"
  | "error"
  | "success"
  | "warn";
export type ContentVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "quaternary"
  | "accent"
  | "accentStrong"
  | "error"
  | "success"
  | "warn";
export type StrokeVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "accentStrong";

export type OverrideBGClass =
  | BgClass
  | HoverBgClass
  | ActiveBgClass
  | `${BgClass} ${HoverBgClass}`
  | `${BgClass} ${ActiveBgClass}`
  | `${HoverBgClass} ${ActiveBgClass}`
  | `${BgClass} ${HoverBgClass} ${ActiveBgClass}`;

export type OverrideTextColorClass =
  | TextColorClass
  | HoverTextColorClass
  | ActiveTextColorClass
  | `${TextColorClass} ${HoverTextColorClass}`
  | `${TextColorClass} ${ActiveTextColorClass}`
  | `${HoverTextColorClass} ${ActiveTextColorClass}`
  | `${TextColorClass} ${HoverTextColorClass} ${ActiveTextColorClass}`;

export type OverrideBorderClass =
  | BorderClass
  | HoverBorderClass
  | ActiveBorderClass
  | `${BorderClass} ${HoverBorderClass}`
  | `${BorderClass} ${ActiveBorderClass}`
  | `${HoverBorderClass} ${ActiveBorderClass}`
  | `${BorderClass} ${HoverBorderClass} ${ActiveBorderClass}`;

type BgClass = `bg-surface-${SurfaceVariant}` | "bg-transparent";
type TextColorClass = `text-content-${ContentVariant}` | "text-primary";
type BorderClass = `border-stroke-${StrokeVariant}` | "border-transparent";

type HoverBgClass = `hover:bg-surface-${SurfaceVariant}` | "hover:bg-transparent";
type HoverTextColorClass = `hover:text-content-${ContentVariant}` | "hover:text-primary";
type HoverBorderClass =
  | `hover:border-stroke-${StrokeVariant}`
  | "hover:border-transparent";

type ActiveBgClass = `active:bg-surface-${SurfaceVariant}` | "active:bg-transparent";
type ActiveTextColorClass =
  | `active:text-content-${ContentVariant}`
  | "active:text-primary";
type ActiveBorderClass =
  | `active:border-stroke-${StrokeVariant}`
  | "active:border-transparent";
