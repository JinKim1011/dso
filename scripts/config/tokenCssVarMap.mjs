export const TOKEN_CSS_VAR_RULES = [
  { type: "FontSizeStep", cssVarPrefix: "--text-", kind: "primitive" },
  { type: "FontWeightStep", cssVarPrefix: "--font-", kind: "primitive" },
  { type: "LineHeightStep", cssVarPrefix: "--leading-", kind: "primitive" },
  { type: "LineHeightStep", cssVarPrefix: "--leading-", kind: "primitive" },
  { type: "SpacingStep", cssVarPrefix: "--spacing-", kind: "primitive" },
  { type: "DurationVariant", cssVarPrefix: "--duration-", kind: "primitive" },
  { type: "EaseVariant", cssVarPrefix: "--ease-", kind: "primitive" },
  { type: "SurfaceVariant", cssVarPrefix: "--bg-", kind: "primitive" },
  { type: "ContentVariant", cssVarPrefix: "--text-", kind: "primitive" },
  { type: "StrokeVariant", cssVarPrefix: "--stroke-", kind: "primitive" },

  { type: "PaddingClass", kind: "class-union" },
  { type: "PaddingXClass", kind: "class-union" },
  { type: "PaddingYClass", kind: "class-union" },

  { type: "MarginClass", kind: "class-union" },
  { type: "MarginXClass", kind: "class-union" },
  { type: "MarginYClass", kind: "class-union" },

  { type: "BgClass", kind: "class-union" },
  { type: "TextColorClass", kind: "class-union" },
  { type: "BorderClass", kind: "class-union" },

  { type: "HoverBgClass", kind: "class-union" },
  { type: "HoverTextColorClass", kind: "class-union" },
  { type: "HoverBorderClass", kind: "class-union" },

  { type: "ActiveBgClass", kind: "class-union" },
  { type: "ActiveTextColorClass", kind: "class-union" },
  { type: "ActiveBorderClass", kind: "class-union" },

  { type: "TypographyVariant", kind: "semantic" },
];
