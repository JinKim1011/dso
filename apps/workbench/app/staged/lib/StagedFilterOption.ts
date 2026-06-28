export const FILTER_OPTIONS = [
  "ALL",
  "COLOR",
  "TYPOGRAPHY",
  "SPACING",
  "RADIUS",
  "SHADOW",
  "MOTION",
] as const;

export type StagedFilterOption = (typeof FILTER_OPTIONS)[number];

export default FILTER_OPTIONS;
