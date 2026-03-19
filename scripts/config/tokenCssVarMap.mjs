export const TOKEN_CSS_VAR_RULES = [
  {
    category: "typography",
    type: "FontSizeStep",
    cssVarPrefix: "--text-",
    kind: "primitive",
  },
  {
    category: "typography",
    type: "FontWeightStep",
    cssVarPrefix: "--font-",
    kind: "primitive",
  },
  {
    category: "typography",
    type: "LineHeightStep",
    cssVarPrefix: "--leading-",
    kind: "primitive",
  },
  {
    category: "spacing",
    type: "SpacingStep",
    cssVarPrefix: "--spacing-",
    kind: "primitive",
  },
  {
    category: "motion",
    type: "DurationVariant",
    cssVarPrefix: "--duration-",
    kind: "primitive",
  },
  {
    category: "motion",
    type: "EaseVariant",
    cssVarPrefix: "--ease-",
    kind: "primitive",
  },
  {
    category: "color",
    type: "SurfaceVariant",
    cssVarPrefix: "--bg-",
    kind: "primitive",
  },
  {
    category: "color",
    type: "ContentVariant",
    cssVarPrefix: "--text-",
    kind: "primitive",
  },
  {
    category: "color",
    type: "StrokeVariant",
    cssVarPrefix: "--stroke-",
    kind: "primitive",
  },

  { category: "spacing", type: "PaddingClass", kind: "class-union" },
  { category: "spacing", type: "PaddingXClass", kind: "class-union" },
  { category: "spacing", type: "PaddingYClass", kind: "class-union" },

  { category: "spacing", type: "MarginClass", kind: "class-union" },
  { category: "spacing", type: "MarginXClass", kind: "class-union" },
  { category: "spacing", type: "MarginYClass", kind: "class-union" },

  { category: "spacing", type: "GapClass", kind: "class-union" }

  { category: "color", type: "BgClass", kind: "class-union" },
  { category: "color", type: "TextColorClass", kind: "class-union" },
  { category: "color", type: "BorderClass", kind: "class-union" },

  { category: "color", type: "HoverBgClass", kind: "class-union" },
  { category: "color", type: "HoverTextColorClass", kind: "class-union" },
  { category: "color", type: "HoverBorderClass", kind: "class-union" },

  { category: "color", type: "ActiveBgClass", kind: "class-union" },
  { category: "color", type: "ActiveTextColorClass", kind: "class-union" },
  { category: "color", type: "ActiveBorderClass", kind: "class-union" },

  { category: "typography", type: "TypographyVariant", kind: "semantic" },
];
