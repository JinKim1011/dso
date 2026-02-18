export type FontSizeStep =
  | "micro"
  | "microPlus"
  | "mini"
  | "miniPlus"
  | "small"
  | "smallPlus"
  | "regular"
  | "regularPlus"
  | "large"
  | "largePlus"
  | "title1"
  | "title2"
  | "title3";

export type FontWeightStep = "regular" | "semibold" | "bold";

export type LineHeightStep = "tight" | "normal" | "relaxed";

export type FontSizeClass = `text-${FontSizeStep}`;
export type FontWeightClass = `font-${FontWeightStep}`;
export type LineHeightClass = `leading-${LineHeightStep}`;

export type TypographyVariant =
  | "heading-xl"
  | "heading-lg"
  | "heading-md"
  | "body-md"
  | "body-md-strong"
  | "body-sm"
  | "body-sm-strong"
  | "label-sm"
  | "label-xs"
  | "meta-sm"
  | "meta-xs"
  | "control-md"
  | "control-sm"
  | "input-label-sm"
  | "input-helper-sm";

export const typographyStyles: Record<TypographyVariant, string> = {
  "heading-xl": "text-title1 font-bold leading-tight",
  "heading-lg": "text-title2 font-bold leading-tight",
  "heading-md": "text-title3 font-semibold leading-normal",
  "body-md": "text-regular font-regular leading-normal",
  "body-md-strong": "text-regular font-semibold leading-normal",
  "body-sm": "text-small font-regular leading-normal",
  "body-sm-strong": "text-small font-semibold leading-normal",
  "label-sm": "text-small font-semibold leading-tight",
  "label-xs": "text-mini font-semibold leading-tight",
  "meta-sm": "text-small font-regular leading-relaxed",
  "meta-xs": "text-mini font-regular leading-relaxed",
  "control-md": "text-regular font-regular leading-tight",
  "control-sm": "text-small font-regular leading-tight",
  "input-label-sm": "text-small font-semibold leading-tight",
  "input-helper-sm": "text-mini font-regular leading-normal",
};
