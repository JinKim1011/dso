export type RadiusStep =
  | "micro"
  | "mini"
  | "small"
  | "regular"
  | "large"
  | "largePlus"
  | "round";

export type RadiusClass = `rounded-${RadiusStep}` | "rounded-none";
