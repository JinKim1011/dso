export type SpacingStep =
  | "micro"
  | "microPlus"
  | "mini"
  | "miniPlus"
  | "small"
  | "smallPlus"
  | "regular"
  | "regularPlus"
  | "large"
  | "largePlus";

export type PaddingClass = `p-${SpacingStep}` | "p-0";
export type PaddingXClass = `px-${SpacingStep}` | "px-0";
export type PaddingYClass = `py-${SpacingStep}` | "py-0";

export type MarginClass = `m-${SpacingStep}` | "m-0";
export type MarginXClass = `mx-${SpacingStep}` | "mx-0";
export type MarginYClass = `my-${SpacingStep}` | "my-0";

export type GapClass = `gap-${SpacingStep}`;
