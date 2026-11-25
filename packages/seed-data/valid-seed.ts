// represents a complete, realistic database seed.

// TODO:
// Expand seed coverage to all contract-supported category/type-kind combinations,
// unresolved values, and semantic motion references.

import type { SeedData } from "@repo/contracts/seed";
import type { Token, TokenType } from "@repo/contracts/type";
import { seedIds } from "@repo/seed-data/ids";

const {
  primitiveColor: primitiveColorTypeId,
  semanticSurface: semanticSurfaceTypeId,
  semanticSurfaceInteractive: semanticSurfaceInteractiveTypeId,
  semanticSurfaceFeedback: semanticSurfaceFeedbackTypeId,
  semanticContent: semanticContentTypeId,
  semanticContentInteractive: semanticContentInteractiveTypeId,
  semanticContentFeedback: semanticContentFeedbackTypeId,
  semanticStroke: semanticStrokeTypeId,
  semanticStrokeInteractive: semanticStrokeInteractiveTypeId,
  semanticStrokeFeedback: semanticStrokeFeedbackTypeId,
  primitiveFontSize: primitiveFontSizeTypeId,
  primitiveFontWeight: primitiveFontWeightTypeId,
  primitiveLineHeight: primitiveLineHeightTypeId,
  semanticTypography: semanticTypographyTypeId,
  primitiveEaseIn: primitiveEaseInTypeId,
  primitiveEaseOut: primitiveEaseOutTypeId,
  primitiveEaseInOut: primitiveEaseInOutTypeId,
  primitivePadding: primitivePaddingTypeId,
  primitiveMargin: primitiveMarginTypeId,
  primitiveGap: primitiveGapTypeId,
  semanticComponent: semanticComponentTypeId,
  semanticLayout: semanticLayoutTypeId,
  semanticInline: semanticInlineTypeId,
  primitiveRadiusScale: primitiveRadiusScaleTypeId,
  semanticRadiusComponent: semanticRadiusComponentTypeId,
  semanticRadiusModal: semanticRadiusModalTypeId,
  semanticRadiusCard: semanticRadiusCardTypeId,
  semanticRadiusButton: semanticRadiusButtonTypeId,
  semanticRadiusInputField: semanticRadiusInputFieldTypeId,
  primitiveLightElevation: primitiveLightElevationTypeId,
  primitiveDarkElevation: primitiveDarkElevationTypeId,
  semanticShadowComponent: semanticShadowComponentTypeId,
  semanticShadowLayout: semanticShadowLayoutTypeId,
  semanticShadowModal: semanticShadowModalTypeId,
  semanticShadowCard: semanticShadowCardTypeId,
  semanticShadowSidebar: semanticShadowSidebarTypeId,
  semanticShadowHeader: semanticShadowHeaderTypeId,
} = seedIds.tokenTypes;

let nextTokenId = 0;
const tokenId = () => {
  const id = seedIds.tokens[nextTokenId++];

  if (!id) {
    throw new Error("Missing deterministic fixture token ID");
  }

  return id;
};

const createTokenType = (
  id: string,
  name: string,
  category: TokenType["category"],
  kind: TokenType["kind"],
  parentTypeId: string | null = null,
): TokenType => ({
  id,
  projectId: seedIds.project,
  parentTypeId,
  category,
  name,
  kind,
});

const primitiveColorValues = [
  ["neutral-0", "oklch(98.5% 0 0)"],
  ["neutral-50", "oklch(97% 0 0)"],
  ["neutral-100", "oklch(92.2% 0 0)"],
  ["neutral-200", "oklch(87% 0 0)"],
  ["neutral-300", "oklch(70.8% 0 0)"],
  ["neutral-400", "oklch(55.6% 0 0)"],
  ["neutral-500", "oklch(43.9% 0 0)"],
  ["neutral-600", "oklch(37.1% 0 0)"],
  ["neutral-700", "oklch(26.9% 0 0)"],
  ["neutral-800", "oklch(20.5% 0 0)"],
  ["neutral-900", "oklch(14.5% 0 0)"],
  ["orange-500", "oklch(70.5% 0.213 47.604)"],
  ["cyan-500", "oklch(71.5% 0.143 215.221)"],
  ["emerald-500", "oklch(69.6% 0.17 162.48)"],
  ["pink-500", "oklch(65.6% 0.241 354.308)"],
  ["amber-50", "oklch(27.9% 0.077 45.635)"],
  ["amber-100", "oklch(41.4% 0.112 45.904)"],
  ["amber-500", "oklch(76.9% 0.188 70.08)"],
  ["lime-50", "oklch(27.4% 0.072 132.109)"],
  ["lime-100", "oklch(40.5% 0.101 131.063)"],
  ["lime-500", "oklch(76.8% 0.233 130.85)"],
  ["red-50", "oklch(25.8% 0.092 26.042)"],
  ["red-100", "oklch(39.6% 0.141 25.723)"],
  ["red-500", "oklch(63.7% 0.237 25.331)"],
] as const;

const primitiveColorTokens: Token[] = primitiveColorValues.map(([name, value]) => ({
  id: tokenId(),
  projectId: seedIds.project,
  tokenTypeId: primitiveColorTypeId,
  name,
  cssVar: `--base-${name}`,
  value: { kind: "single", value },
}));

const primitiveColorByName = new Map(
  primitiveColorTokens.map((token) => [token.name, token]),
);

const semanticColorValues = [
  ["surface", "neutral-0", "neutral-900", semanticSurfaceTypeId],
  ["surface-muted", "neutral-50", "neutral-800", semanticSurfaceTypeId],
  ["surface-interactive", "neutral-0", "neutral-900", semanticSurfaceInteractiveTypeId],
  [
    "surface-interactive-hoverWeak",
    "neutral-50",
    "neutral-800",
    semanticSurfaceInteractiveTypeId,
  ],
  [
    "surface-interactive-hoverStrong",
    "neutral-100",
    "neutral-700",
    semanticSurfaceInteractiveTypeId,
  ],
  [
    "surface-interactive-active",
    "neutral-200",
    "neutral-600",
    semanticSurfaceInteractiveTypeId,
  ],
  [
    "surface-interactive-disabled",
    "neutral-0",
    "neutral-900",
    semanticSurfaceInteractiveTypeId,
  ],
  ["surface-feedback-success", "lime-50", "lime-500", semanticSurfaceFeedbackTypeId],
  ["surface-feedback-warning", "amber-50", "amber-500", semanticSurfaceFeedbackTypeId],
  ["surface-feedback-error", "red-50", "red-500", semanticSurfaceFeedbackTypeId],
  ["content-default", "neutral-900", "neutral-0", semanticContentTypeId],
  ["content-muted", "neutral-600", "neutral-200", semanticContentTypeId],
  ["content-interactive", "neutral-600", "neutral-200", semanticContentInteractiveTypeId],
  [
    "content-interactive-muted",
    "neutral-400",
    "neutral-400",
    semanticContentInteractiveTypeId,
  ],
  [
    "content-interactive-hover",
    "neutral-900",
    "neutral-0",
    semanticContentInteractiveTypeId,
  ],
  [
    "content-interactive-focus",
    "neutral-900",
    "neutral-0",
    semanticContentInteractiveTypeId,
  ],
  [
    "content-interactive-active",
    "neutral-900",
    "neutral-0",
    semanticContentInteractiveTypeId,
  ],
  [
    "content-interactive-disabled",
    "neutral-400",
    "neutral-400",
    semanticContentInteractiveTypeId,
  ],
  ["content-feedback-success", "lime-500", "lime-50", semanticContentFeedbackTypeId],
  ["content-feedback-warning", "amber-500", "amber-50", semanticContentFeedbackTypeId],
  ["content-feedback-error", "red-500", "red-50", semanticContentFeedbackTypeId],
  ["stroke", "neutral-100", "neutral-800", semanticStrokeTypeId],
  ["stroke-muted", "neutral-50", "neutral-900", semanticStrokeTypeId],
  ["stroke-interactive", "neutral-100", "neutral-800", semanticStrokeInteractiveTypeId],
  [
    "stroke-interactive-hover",
    "neutral-200",
    "neutral-700",
    semanticStrokeInteractiveTypeId,
  ],
  [
    "stroke-interactive-active",
    "neutral-200",
    "neutral-700",
    semanticStrokeInteractiveTypeId,
  ],
  [
    "stroke-interactive-focus",
    "neutral-400",
    "neutral-400",
    semanticStrokeInteractiveTypeId,
  ],
  [
    "stroke-interactive-disabled",
    "neutral-50",
    "neutral-900",
    semanticStrokeInteractiveTypeId,
  ],
  ["stroke-feedback-success", "lime-100", "lime-100", semanticStrokeFeedbackTypeId],
  ["stroke-feedback-warning", "amber-100", "amber-100", semanticStrokeFeedbackTypeId],
  ["stroke-feedback-error", "red-100", "red-100", semanticStrokeFeedbackTypeId],
] as const;

const semanticColorTokens: Token[] = semanticColorValues.map(
  ([name, , , tokenTypeId]) => ({
    id: tokenId(),
    projectId: seedIds.project,
    tokenTypeId,
    name,
    cssVar: `--color-${name}`,
    value: { kind: "modes" },
  }),
);

const typographyPrimitiveValues = [
  [
    primitiveFontSizeTypeId,
    "font-size",
    [
      ["micro", "0.6875rem"],
      ["mini", "0.75rem"],
      ["small", "0.875rem"],
      ["regular", "1rem"],
      ["title", "1.125rem"],
    ],
  ],
  [
    primitiveFontWeightTypeId,
    "font-weight",
    [
      ["regular", "400"],
      ["semibold", "600"],
      ["bold", "700"],
    ],
  ],
  [
    primitiveLineHeightTypeId,
    "line-height",
    [
      ["tight", "1.3"],
      ["normal", "1.5"],
      ["relaxed", "1.7"],
    ],
  ],
] as const;

const typographyPrimitiveTokens: Token[] = typographyPrimitiveValues.flatMap(
  ([tokenTypeId, cssPrefix, values]) =>
    values.map(([name, value]) => ({
      id: tokenId(),
      projectId: seedIds.project,
      tokenTypeId,
      name,
      cssVar: `--${cssPrefix === "font-size" ? "text" : cssPrefix === "font-weight" ? "font" : "leading"}-${name}`,
      value: { kind: "single" as const, value },
    })),
);

const typographySemanticValues = [
  ["heading-strong", "title", "bold", "tight"],
  ["heading", "title", "semibold", "tight"],
  ["body-strong", "regular", "semibold", "relaxed"],
  ["body", "regular", "regular", "relaxed"],
  ["caption", "mini", "regular", "relaxed"],
  ["label-large", "small", "regular", "tight"],
  ["label", "mini", "regular", "tight"],
  ["label-small", "micro", "regular", "tight"],
] as const;

const typographySemanticTokens: Token[] = typographySemanticValues.map(([name]) => ({
  id: tokenId(),
  projectId: seedIds.project,
  tokenTypeId: semanticTypographyTypeId,
  name,
  cssVar: null,
  value: { kind: "typography" },
}));

const motionValues = [
  ["ease-in-quad", "cubic-bezier(0.55, 0.085, 0.68, 0.53)"],
  ["ease-in-cubic", "cubic-bezier(0.55, 0.055, 0.675, 0.19)"],
  ["ease-in-quart", "cubic-bezier(0.895, 0.03, 0.685, 0.22)"],
  ["ease-in-quint", "cubic-bezier(0.755, 0.05, 0.855, 0.06)"],
  ["ease-in-expo", "cubic-bezier(0.95, 0.05, 0.795, 0.035)"],
  ["ease-in-circ", "cubic-bezier(0.6, 0.04, 0.98, 0.335)"],
  ["ease-out-quad", "cubic-bezier(0.25, 0.46, 0.45, 0.94)"],
  ["ease-out-cubic", "cubic-bezier(0.215, 0.61, 0.355, 1)"],
  ["ease-out-quart", "cubic-bezier(0.165, 0.84, 0.44, 1)"],
  ["ease-out-quint", "cubic-bezier(0.23, 1, 0.32, 1)"],
  ["ease-out-expo", "cubic-bezier(0.19, 1, 0.22, 1)"],
  ["ease-out-circ", "cubic-bezier(0.075, 0.82, 0.165, 1)"],
  ["ease-in-out-quad", "cubic-bezier(0.455, 0.03, 0.515, 0.955)"],
  ["ease-in-out-cubic", "cubic-bezier(0.645, 0.045, 0.355, 1)"],
  ["ease-in-out-quart", "cubic-bezier(0.77, 0, 0.175, 1)"],
  ["ease-in-out-quint", "cubic-bezier(0.86, 0, 0.07, 1)"],
  ["ease-in-out-expo", "cubic-bezier(1, 0, 0, 1)"],
  ["ease-in-out-circ", "cubic-bezier(0.785, 0.135, 0.15, 0.86)"],
] as const;

const motionTokens: Token[] = motionValues.map(([name, value]) => ({
  id: tokenId(),
  projectId: seedIds.project,
  tokenTypeId: name.startsWith("ease-in-out-")
    ? primitiveEaseInOutTypeId
    : name.startsWith("ease-in-")
      ? primitiveEaseInTypeId
      : primitiveEaseOutTypeId,
  name,
  cssVar: `--${name}`,
  value: { kind: "single", value },
}));

const spacingPrimitiveValues = [
  [
    primitivePaddingTypeId,
    "padding",
    [
      ["micro", "2px"],
      ["mini", "4px"],
      ["small", "8px"],
      ["regular", "12px"],
      ["large", "16px"],
    ],
  ],
  [
    primitiveMarginTypeId,
    "margin",
    [
      ["micro", "16px"],
      ["mini", "24px"],
      ["small", "32px"],
      ["regular", "48px"],
      ["large", "64px"],
    ],
  ],
  [
    primitiveGapTypeId,
    "gap",
    [
      ["micro", "2px"],
      ["mini", "4px"],
      ["small", "8px"],
      ["regular", "12px"],
      ["large", "16px"],
    ],
  ],
] as const;

const spacingPrimitiveTokens: Token[] = spacingPrimitiveValues.flatMap(
  ([tokenTypeId, cssPrefix, values]) =>
    values.map(([name, value]) => ({
      id: tokenId(),
      projectId: seedIds.project,
      tokenTypeId,
      name,
      cssVar: `--spacing-${cssPrefix}-${name}`,
      value: { kind: "single" as const, value },
    })),
);

const spacingSemanticValues = [
  [semanticComponentTypeId, "padding-micro", "micro", primitivePaddingTypeId, "2px"],
  [semanticComponentTypeId, "padding-mini", "mini", primitivePaddingTypeId, "4px"],
  [semanticComponentTypeId, "padding-small", "small", primitivePaddingTypeId, "8px"],
  [semanticComponentTypeId, "padding-regular", "regular", primitivePaddingTypeId, "12px"],
  [semanticComponentTypeId, "padding-large", "large", primitivePaddingTypeId, "16px"],
  [semanticLayoutTypeId, "margin-micro", "micro", primitiveMarginTypeId, "16px"],
  [semanticLayoutTypeId, "margin-mini", "mini", primitiveMarginTypeId, "24px"],
  [semanticLayoutTypeId, "margin-small", "small", primitiveMarginTypeId, "32px"],
  [semanticLayoutTypeId, "margin-regular", "regular", primitiveMarginTypeId, "48px"],
  [semanticLayoutTypeId, "margin-large", "large", primitiveMarginTypeId, "64px"],
  [semanticInlineTypeId, "gap-micro", "micro", primitiveGapTypeId, "2px"],
  [semanticInlineTypeId, "gap-mini", "mini", primitiveGapTypeId, "4px"],
  [semanticInlineTypeId, "gap-small", "small", primitiveGapTypeId, "8px"],
  [semanticInlineTypeId, "gap-regular", "regular", primitiveGapTypeId, "12px"],
  [semanticInlineTypeId, "gap-large", "large", primitiveGapTypeId, "16px"],
] as const;

const spacingSemanticTokens: Token[] = spacingSemanticValues.map(
  ([tokenTypeId, name, , , value]) => ({
    id: tokenId(),
    projectId: seedIds.project,
    tokenTypeId,
    name,
    cssVar: null,
    value: { kind: "single" as const, value },
  }),
);

const radiusScaleValues = [
  ["none", "0px"],
  ["micro", "2px"],
  ["mini", "4px"],
  ["small", "6px"],
  ["regular", "8px"],
  ["large", "12px"],
  ["xlarge", "16px"],
  ["2xlarge", "24px"],
  ["full", "9999px"],
] as const;

const radiusScaleTokens: Token[] = radiusScaleValues.map(([name, value]) => ({
  id: tokenId(),
  projectId: seedIds.project,
  tokenTypeId: primitiveRadiusScaleTypeId,
  name,
  cssVar: `--radius-${name}`,
  value: { kind: "single", value },
}));

const radiusSemanticValues = [
  [semanticRadiusModalTypeId, "small", "small", "6px"],
  [semanticRadiusModalTypeId, "regular", "regular", "8px"],
  [semanticRadiusModalTypeId, "large", "large", "12px"],
  [semanticRadiusModalTypeId, "xlarge", "xlarge", "16px"],
  [semanticRadiusCardTypeId, "small", "mini", "4px"],
  [semanticRadiusCardTypeId, "regular", "small", "6px"],
  [semanticRadiusCardTypeId, "large", "regular", "8px"],
  [semanticRadiusCardTypeId, "xlarge", "large", "12px"],
  [semanticRadiusButtonTypeId, "small", "mini", "4px"],
  [semanticRadiusButtonTypeId, "regular", "small", "6px"],
  [semanticRadiusButtonTypeId, "large", "regular", "8px"],
  [semanticRadiusButtonTypeId, "xlarge", "large", "12px"],
  [semanticRadiusInputFieldTypeId, "small", "mini", "4px"],
  [semanticRadiusInputFieldTypeId, "regular", "small", "6px"],
  [semanticRadiusInputFieldTypeId, "large", "regular", "8px"],
  [semanticRadiusInputFieldTypeId, "xlarge", "large", "12px"],
] as const;

const radiusSemanticTokens: Token[] = radiusSemanticValues.map(
  ([tokenTypeId, name, , value]) => ({
    id: tokenId(),
    projectId: seedIds.project,
    tokenTypeId,
    name,
    cssVar: null,
    value: { kind: "single" as const, value },
  }),
);

const lightElevationValues = [
  ["mini", "0 1px 2px rgba(0, 0, 0, 0.08)"],
  ["small", "0 2px 6px rgba(0, 0, 0, 0.10)"],
  ["regular", "0 4px 12px rgba(0, 0, 0, 0.12)"],
  ["large", "0 12px 32px rgba(0, 0, 0, 0.16)"],
] as const;

const darkElevationValues = [
  ["mini", "0 1px 2px rgba(0, 0, 0, 0.28)"],
  ["small", "0 2px 8px rgba(0, 0, 0, 0.36)"],
  ["regular", "0 6px 16px rgba(0, 0, 0, 0.44)"],
  ["large", "0 16px 40px rgba(0, 0, 0, 0.52)"],
] as const;

const lightElevationTokens: Token[] = lightElevationValues.map(([name, value]) => ({
  id: tokenId(),
  projectId: seedIds.project,
  tokenTypeId: primitiveLightElevationTypeId,
  name,
  cssVar: `--shadow-light-${name}`,
  value: { kind: "single", value },
}));

const darkElevationTokens: Token[] = darkElevationValues.map(([name, value]) => ({
  id: tokenId(),
  projectId: seedIds.project,
  tokenTypeId: primitiveDarkElevationTypeId,
  name,
  cssVar: `--shadow-dark-${name}`,
  value: { kind: "single", value },
}));

const shadowSemanticValues = [
  [semanticShadowModalTypeId, "mini"],
  [semanticShadowModalTypeId, "small"],
  [semanticShadowModalTypeId, "regular"],
  [semanticShadowModalTypeId, "large"],
  [semanticShadowCardTypeId, "mini"],
  [semanticShadowCardTypeId, "small"],
  [semanticShadowCardTypeId, "regular"],
  [semanticShadowCardTypeId, "large"],
  [semanticShadowSidebarTypeId, "mini"],
  [semanticShadowSidebarTypeId, "small"],
  [semanticShadowSidebarTypeId, "regular"],
  [semanticShadowSidebarTypeId, "large"],
  [semanticShadowHeaderTypeId, "mini"],
  [semanticShadowHeaderTypeId, "small"],
  [semanticShadowHeaderTypeId, "regular"],
  [semanticShadowHeaderTypeId, "large"],
] as const;

const shadowSemanticTokens: Token[] = shadowSemanticValues.map(
  ([tokenTypeId, name]) => ({
    id: tokenId(),
    projectId: seedIds.project,
    tokenTypeId,
    name,
    cssVar: null,
    value: { kind: "modes" as const },
  }),
);

const typographyTokensByTypeAndName = new Map(
  typographyPrimitiveTokens.map((token) => [`${token.tokenTypeId}:${token.name}`, token]),
);

const spacingPrimitiveTokensByTypeAndName = new Map(
  spacingPrimitiveTokens.map((token) => [`${token.tokenTypeId}:${token.name}`, token]),
);

const radiusScaleTokensByName = new Map(
  radiusScaleTokens.map((token) => [token.name, token]),
);

const spacingReferences = spacingSemanticValues.map(
  ([, , primitiveName, primitiveTypeId]) => {
    const semanticToken = spacingSemanticTokens.find(
      (token) =>
        token.name ===
        `${primitiveTypeId === primitivePaddingTypeId
          ? "padding"
          : primitiveTypeId === primitiveMarginTypeId
            ? "margin"
            : "gap"}-${primitiveName}`,
    );
    const referencedToken = spacingPrimitiveTokensByTypeAndName.get(
      `${primitiveTypeId}:${primitiveName}`,
    );

    if (!semanticToken) {
      throw new Error(`Missing spacing semantic token: ${primitiveName}`);
    }
    if (!referencedToken) {
      throw new Error(
        `Missing spacing primitive token: ${primitiveTypeId}:${primitiveName}`,
      );
    }

    return {
      projectId: seedIds.project,
      referencingTokenId: semanticToken.id,
      referencedTokenId: referencedToken.id,
      slot: "value" as const,
    };
  },
);

const radiusReferences = radiusSemanticValues.map(
  ([tokenTypeId, semanticName, primitiveName]) => {
    const semanticToken = radiusSemanticTokens.find(
      (token) =>
        token.tokenTypeId === tokenTypeId && token.name === semanticName,
    );
    const referencedToken = radiusScaleTokensByName.get(primitiveName);

    if (!semanticToken) {
      throw new Error(
        `Missing radius semantic token: ${tokenTypeId}:${semanticName}`,
      );
    }
    if (!referencedToken) {
      throw new Error(`Missing radius primitive token: ${primitiveName}`);
    }

    return {
      projectId: seedIds.project,
      referencingTokenId: semanticToken.id,
      referencedTokenId: referencedToken.id,
      slot: "value" as const,
    };
  },
);

const lightElevationTokensByName = new Map(
  lightElevationTokens.map((token) => [token.name, token]),
);

const darkElevationTokensByName = new Map(
  darkElevationTokens.map((token) => [token.name, token]),
);

const shadowReferences = shadowSemanticValues.flatMap(
  ([tokenTypeId, elevationName]) => {
    const semanticToken = shadowSemanticTokens.find(
      (token) =>
        token.tokenTypeId === tokenTypeId && token.name === elevationName,
    );
    const lightToken = lightElevationTokensByName.get(elevationName);
    const darkToken = darkElevationTokensByName.get(elevationName);

    if (!semanticToken) {
      throw new Error(
        `Missing shadow semantic token: ${tokenTypeId}:${elevationName}`,
      );
    }
    if (!lightToken || !darkToken) {
      throw new Error(`Missing shadow primitive elevation: ${elevationName}`);
    }

    return [
      {
        projectId: seedIds.project,
        referencingTokenId: semanticToken.id,
        referencedTokenId: lightToken.id,
        slot: "light" as const,
      },
      {
        projectId: seedIds.project,
        referencingTokenId: semanticToken.id,
        referencedTokenId: darkToken.id,
        slot: "dark" as const,
      },
    ];
  },
);

const colorReferences = semanticColorTokens
  .map((token) => {
    const [, lightPrimitiveName, darkPrimitiveName] = semanticColorValues.find(
      ([name]) => name === token.name,
    )!;
    const lightToken = primitiveColorByName.get(lightPrimitiveName)!;
    const darkToken = primitiveColorByName.get(darkPrimitiveName)!;

    return [
      {
        projectId: seedIds.project,
        referencingTokenId: token.id,
        referencedTokenId: lightToken.id,
        slot: "light" as const,
      },
      {
        projectId: seedIds.project,
        referencingTokenId: token.id,
        referencedTokenId: darkToken.id,
        slot: "dark" as const,
      },
    ];
  })
  .flat();

const typographyReferences = typographySemanticTokens.flatMap((token) => {
  const [, fontSize, fontWeight, lineHeight] = typographySemanticValues.find(
    ([name]) => name === token.name,
  )!;

  const references = [
    ["fontSize", primitiveFontSizeTypeId, fontSize],
    ["fontWeight", primitiveFontWeightTypeId, fontWeight],
    ["lineHeight", primitiveLineHeightTypeId, lineHeight],
  ] as const;

  return references.map(([slot, typeId, primitiveName]) => {
    const referencedToken = typographyTokensByTypeAndName.get(
      `${typeId}:${primitiveName}`,
    );

    if (!referencedToken) {
      throw new Error(`Missing typography primitive token: ${typeId}:${primitiveName}`);
    }

    return {
      projectId: seedIds.project,
      referencingTokenId: token.id,
      referencedTokenId: referencedToken.id,
      slot,
    };
  });
});

const tokenTypes: TokenType[] = [
  //color
  createTokenType(primitiveColorTypeId, "Base", "color", "primitive"),
  createTokenType(semanticSurfaceTypeId, "surface", "color", "semantic"),
  createTokenType(
    semanticSurfaceInteractiveTypeId,
    "interactive",
    "color",
    "semantic",
    semanticSurfaceTypeId,
  ),
  createTokenType(semanticSurfaceFeedbackTypeId, "feedback", "color", "semantic"),
  createTokenType(
    semanticContentTypeId,
    "content",
    "color",
    "semantic",
    primitiveColorTypeId,
  ),
  createTokenType(
    semanticContentInteractiveTypeId,
    "interactive",
    "color",
    "semantic",
    semanticContentTypeId,
  ),
  createTokenType(semanticContentFeedbackTypeId, "feedback", "color", "semantic"),
  createTokenType(semanticStrokeTypeId, "stroke", "color", "semantic"),
  createTokenType(
    semanticStrokeInteractiveTypeId,
    "interactive",
    "color",
    "semantic",
    semanticStrokeTypeId,
  ),
  createTokenType(semanticStrokeFeedbackTypeId, "feedback", "color", "semantic"),
  // typography
  createTokenType(primitiveFontSizeTypeId, "font-size", "typography", "primitive"),
  createTokenType(primitiveFontWeightTypeId, "font-weight", "typography", "primitive"),
  createTokenType(primitiveLineHeightTypeId, "line-height", "typography", "primitive"),
  createTokenType(semanticTypographyTypeId, "Typography", "typography", "semantic"),
  createTokenType(primitiveEaseInTypeId, "ease-in", "motion", "primitive"),
  createTokenType(primitiveEaseOutTypeId, "ease-out", "motion", "primitive"),
  createTokenType(primitiveEaseInOutTypeId, "ease-in-out", "motion", "primitive"),
  // spacing
  createTokenType(primitivePaddingTypeId, "padding", "spacing", "primitive"),
  createTokenType(primitiveMarginTypeId, "margin", "spacing", "primitive"),
  createTokenType(primitiveGapTypeId, "gap", "spacing", "primitive"),
  createTokenType(
    semanticComponentTypeId,
    "component",
    "spacing",
    "semantic",
    primitivePaddingTypeId,
  ),
  createTokenType(
    semanticLayoutTypeId,
    "layout",
    "spacing",
    "semantic",
    primitiveMarginTypeId,
  ),
  createTokenType(
    semanticInlineTypeId,
    "inline",
    "spacing",
    "semantic",
    primitiveGapTypeId,
  ),
  // radius
  createTokenType(
    primitiveRadiusScaleTypeId,
    "scale",
    "radius",
    "primitive",
  ),
  createTokenType(
    semanticRadiusComponentTypeId,
    "component",
    "radius",
    "semantic",
  ),
  createTokenType(
    semanticRadiusModalTypeId,
    "modal",
    "radius",
    "semantic",
    semanticRadiusComponentTypeId,
  ),
  createTokenType(
    semanticRadiusCardTypeId,
    "card",
    "radius",
    "semantic",
    semanticRadiusComponentTypeId,
  ),
  createTokenType(
    semanticRadiusButtonTypeId,
    "button",
    "radius",
    "semantic",
    semanticRadiusComponentTypeId,
  ),
  createTokenType(
    semanticRadiusInputFieldTypeId,
    "input-field",
    "radius",
    "semantic",
    semanticRadiusComponentTypeId,
  ),
  // shadow
  createTokenType(
    primitiveLightElevationTypeId,
    "light-elevation",
    "shadow",
    "primitive",
  ),
  createTokenType(
    primitiveDarkElevationTypeId,
    "dark-elevation",
    "shadow",
    "primitive",
  ),
  createTokenType(
    semanticShadowComponentTypeId,
    "component",
    "shadow",
    "semantic",
  ),
  createTokenType(
    semanticShadowLayoutTypeId,
    "layout",
    "shadow",
    "semantic",
  ),
  createTokenType(
    semanticShadowModalTypeId,
    "modal",
    "shadow",
    "semantic",
    semanticShadowComponentTypeId,
  ),
  createTokenType(
    semanticShadowCardTypeId,
    "card",
    "shadow",
    "semantic",
    semanticShadowComponentTypeId,
  ),
  createTokenType(
    semanticShadowSidebarTypeId,
    "sidebar",
    "shadow",
    "semantic",
    semanticShadowLayoutTypeId,
  ),
  createTokenType(
    semanticShadowHeaderTypeId,
    "header",
    "shadow",
    "semantic",
    semanticShadowLayoutTypeId,
  ),
];

export const validSeed: SeedData = {
  users: [
    {
      id: seedIds.users.editor,
      email: "editor@example.test",
      passwordHash: "fake-seed-hash",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
    {
      id: seedIds.users.publisher,
      email: "publisher@example.test",
      passwordHash: "fake-seed-hash",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
    {
      id: seedIds.users.admin,
      email: "admin@example.test",
      passwordHash: "fake-seed-hash",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
    {
      id: seedIds.users.nonmember,
      email: "nonmember@example.test",
      passwordHash: "fake-seed-hash",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  projects: [
    {
      id: seedIds.project,
      slug: "design-system",
      name: "Design System",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  projectMembers: [
    {
      projectId: seedIds.project,
      userId: seedIds.users.editor,
      role: "editor",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
    {
      projectId: seedIds.project,
      userId: seedIds.users.publisher,
      role: "publisher",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
    {
      projectId: seedIds.project,
      userId: seedIds.users.admin,
      role: "admin",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  tokenTypes,
  tokens: [
    ...primitiveColorTokens,
    ...semanticColorTokens,
    ...typographyPrimitiveTokens,
    ...typographySemanticTokens,
    ...motionTokens,
    ...spacingPrimitiveTokens,
    ...spacingSemanticTokens,
    ...radiusScaleTokens,
    ...radiusSemanticTokens,
    ...lightElevationTokens,
    ...darkElevationTokens,
    ...shadowSemanticTokens,
  ],
  tokenReferences: [
    ...colorReferences,
    ...typographyReferences,
    ...spacingReferences,
    ...radiusReferences,
    ...shadowReferences,
  ],
  components: [
    {
      id: seedIds.component,
      projectId: seedIds.project,
      name: "Button",
      slug: "button",
      description: "Button component",
      documentPath: "components/button.md",
    },
  ],
  documentTemplates: [
    {
      id: seedIds.documentTemplate,
      projectId: seedIds.project,
      componentId: seedIds.component,
      name: "Button documentation",
      content: "# Button",
    },
  ],
  releases: [
    {
      id: seedIds.release,
      projectId: seedIds.project,
      version: "1",
      status: "published",
      publishedAt: "2026-10-27T10:00:00.000Z",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
};
