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

export type TypographyRecipe = {
  fontSize: FontSizeStep;
  fontWeight: FontWeightStep;
  lineHeight: LineHeightStep;
};

export const typographyStyles: Record<TypographyVariant, TypographyRecipe> = {
  "heading-xl": {
    fontSize: "title1",
    fontWeight: "bold",
    lineHeight: "tight",
  },
  "heading-lg": {
    fontSize: "title3",
    fontWeight: "bold",
    lineHeight: "normal",
  },
  "heading-md": {
    fontSize: "title3",
    fontWeight: "semibold",
    lineHeight: "normal",
  },
  "body-md": {
    fontSize: "regular",
    fontWeight: "regular",
    lineHeight: "normal",
  },
  "body-md-strong": {
    fontSize: "regular",
    fontWeight: "semibold",
    lineHeight: "normal",
  },
  "body-sm": {
    fontSize: "small",
    fontWeight: "regular",
    lineHeight: "normal",
  },
  "body-sm-strong": {
    fontSize: "small",
    fontWeight: "semibold",
    lineHeight: "normal",
  },
  "label-sm": {
    fontSize: "small",
    fontWeight: "semibold",
    lineHeight: "tight",
  },
  "label-xs": {
    fontSize: "mini",
    fontWeight: "semibold",
    lineHeight: "tight",
  },
  "meta-sm": {
    fontSize: "small",
    fontWeight: "regular",
    lineHeight: "relaxed",
  },
  "meta-xs": {
    fontSize: "mini",
    fontWeight: "regular",
    lineHeight: "relaxed",
  },
  "control-md": {
    fontSize: "regular",
    fontWeight: "regular",
    lineHeight: "tight",
  },
  "control-sm": {
    fontSize: "small",
    fontWeight: "regular",
    lineHeight: "tight",
  },
  "input-label-sm": {
    fontSize: "small",
    fontWeight: "semibold",
    lineHeight: "tight",
  },
  "input-helper-sm": {
    fontSize: "mini",
    fontWeight: "regular",
    lineHeight: "normal",
  },
};
