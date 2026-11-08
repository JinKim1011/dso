import { fixtureIds } from "@repo/contracts/fixtures/ids";
import type { SeedData } from "@repo/contracts/seed";
import type { Token, TokenType } from "@repo/contracts/type";
import { randomUUID } from "node:crypto";

const primitiveDarkColorTypeId = randomUUID();
const primitiveLightColorTypeId = randomUUID();
const semanticSurfaceTypeId = randomUUID();
const semanticSurfaceInteractiveTypeId = randomUUID();
const semanticSurfaceFeedbackTypeId = randomUUID();
const semanticContentTypeId = randomUUID();
const semanticContentInteractiveTypeId = randomUUID();
const semanticContentFeedbackTypeId = randomUUID();
const semanticStrokeTypeId = randomUUID();
const semanticStrokeInteractiveTypeId = randomUUID();
const semanticStrokeFeedbackTypeId = randomUUID();
const semanticHeaderTypeId = randomUUID();
const primitiveFontSizeTypeId = randomUUID();
const primitiveFontWeightTypeId = randomUUID();
const primitiveLineHeightTypeId = randomUUID();
const semanticTypographyTypeId = randomUUID();
const primitiveEaseInTypeId = randomUUID();
const primitiveEaseOutTypeId = randomUUID();
const primitiveEaseInOutTypeId = randomUUID();

const tokenId = () => randomUUID();

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
  projectId: fixtureIds.project,
  tokenTypeId: primitiveDarkColorTypeId,
  name,
  cssVar: `--base-${name}`,
  value: { kind: "single", value },
}));

const primitiveColorByName = new Map(
  primitiveColorTokens.map((token) => [token.name, token]),
);

const primitiveLightColorTokens: Token[] = primitiveColorValues.map(([name, value]) => ({
  id: tokenId(),
  projectId: fixtureIds.project,
  tokenTypeId: primitiveLightColorTypeId,
  name,
  cssVar: `--base-light-${name}`,
  value: { kind: "single", value },
}));

const primitiveLightColorByName = new Map(
  primitiveLightColorTokens.map((token) => [token.name, token]),
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
  ["header-stripe", "neutral-0", "neutral-900", semanticHeaderTypeId],
] as const;

const semanticColorTokens: Token[] = semanticColorValues.map(
  ([name, lightPrimitiveName, darkPrimitiveName, tokenTypeId]) => ({
    id: tokenId(),
    projectId: fixtureIds.project,
    tokenTypeId,
    name,
    cssVar: `--color-${name}`,
    value: {
      kind: "modes",
      light: `var(--base-light-${lightPrimitiveName})`,
      dark: `var(--base-${darkPrimitiveName})`,
    },
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
      projectId: fixtureIds.project,
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

const typographySemanticTokens: Token[] = typographySemanticValues.map(
  ([name, fontSize, fontWeight, lineHeight]) => ({
    id: tokenId(),
    projectId: fixtureIds.project,
    tokenTypeId: semanticTypographyTypeId,
    name,
    cssVar: null,
    value: {
      kind: "typography",
      fontSize: `var(--text-${fontSize})`,
      fontWeight: `var(--font-${fontWeight})`,
      lineHeight: `var(--leading-${lineHeight})`,
    },
  }),
);

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
  projectId: fixtureIds.project,
  tokenTypeId: name.startsWith("ease-in-out-")
    ? primitiveEaseInOutTypeId
    : name.startsWith("ease-in-")
      ? primitiveEaseInTypeId
      : primitiveEaseOutTypeId,
  name,
  cssVar: `--${name}`,
  value: { kind: "single", value },
}));

const typographyTokensByTypeAndName = new Map(
  typographyPrimitiveTokens.map((token) => [`${token.tokenTypeId}:${token.name}`, token]),
);

const colorReferences = semanticColorTokens
  .map((token) => {
    const [, lightPrimitiveName, darkPrimitiveName] = semanticColorValues.find(
      ([name]) => name === token.name,
    )!;
    const darkToken = primitiveColorByName.get(darkPrimitiveName)!;
    const lightToken = primitiveLightColorByName.get(lightPrimitiveName)!;

    return [
      {
        projectId: fixtureIds.project,
        referencingTokenId: token.id,
        referencedTokenId: lightToken.id,
        slot: "light" as const,
      },
      {
        projectId: fixtureIds.project,
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
      projectId: fixtureIds.project,
      referencingTokenId: token.id,
      referencedTokenId: referencedToken.id,
      slot,
    };
  });
});

const tokenTypes: TokenType[] = [
  {
    id: primitiveDarkColorTypeId,
    projectId: fixtureIds.project,
    parentTypeId: null,
    category: "color",
    name: "Base Dark",
    kind: "primitive",
  },
  {
    id: primitiveLightColorTypeId,
    projectId: fixtureIds.project,
    parentTypeId: null,
    category: "color",
    name: "Base Light",
    kind: "primitive",
  },
  {
    id: semanticSurfaceTypeId,
    projectId: fixtureIds.project,
    parentTypeId: primitiveDarkColorTypeId,
    category: "color",
    name: "surface",
    kind: "semantic",
  },
  {
    id: semanticSurfaceInteractiveTypeId,
    projectId: fixtureIds.project,
    parentTypeId: semanticSurfaceTypeId,
    category: "color",
    name: "interactive",
    kind: "semantic",
  },
  {
    id: semanticSurfaceFeedbackTypeId,
    projectId: fixtureIds.project,
    parentTypeId: semanticSurfaceTypeId,
    category: "color",
    name: "feedback",
    kind: "semantic",
  },
  {
    id: semanticContentTypeId,
    projectId: fixtureIds.project,
    parentTypeId: primitiveDarkColorTypeId,
    category: "color",
    name: "content",
    kind: "semantic",
  },
  {
    id: semanticContentInteractiveTypeId,
    projectId: fixtureIds.project,
    parentTypeId: semanticContentTypeId,
    category: "color",
    name: "interactive",
    kind: "semantic",
  },
  {
    id: semanticContentFeedbackTypeId,
    projectId: fixtureIds.project,
    parentTypeId: semanticContentTypeId,
    category: "color",
    name: "feedback",
    kind: "semantic",
  },
  {
    id: semanticStrokeTypeId,
    projectId: fixtureIds.project,
    parentTypeId: primitiveDarkColorTypeId,
    category: "color",
    name: "stroke",
    kind: "semantic",
  },
  {
    id: semanticStrokeInteractiveTypeId,
    projectId: fixtureIds.project,
    parentTypeId: semanticStrokeTypeId,
    category: "color",
    name: "interactive",
    kind: "semantic",
  },
  {
    id: semanticStrokeFeedbackTypeId,
    projectId: fixtureIds.project,
    parentTypeId: semanticStrokeTypeId,
    category: "color",
    name: "feedback",
    kind: "semantic",
  },
  {
    id: semanticHeaderTypeId,
    projectId: fixtureIds.project,
    parentTypeId: primitiveDarkColorTypeId,
    category: "color",
    name: "header",
    kind: "semantic",
  },
  {
    id: primitiveFontSizeTypeId,
    projectId: fixtureIds.project,
    parentTypeId: null,
    category: "typography",
    name: "font-size",
    kind: "primitive",
  },
  {
    id: primitiveFontWeightTypeId,
    projectId: fixtureIds.project,
    parentTypeId: null,
    category: "typography",
    name: "font-weight",
    kind: "primitive",
  },
  {
    id: primitiveLineHeightTypeId,
    projectId: fixtureIds.project,
    parentTypeId: null,
    category: "typography",
    name: "line-height",
    kind: "primitive",
  },
  {
    id: semanticTypographyTypeId,
    projectId: fixtureIds.project,
    parentTypeId: null,
    category: "typography",
    name: "Typography",
    kind: "semantic",
  },
  {
    id: primitiveEaseInTypeId,
    projectId: fixtureIds.project,
    parentTypeId: null,
    category: "motion",
    name: "ease-in",
    kind: "primitive",
  },
  {
    id: primitiveEaseOutTypeId,
    projectId: fixtureIds.project,
    parentTypeId: null,
    category: "motion",
    name: "ease-out",
    kind: "primitive",
  },
  {
    id: primitiveEaseInOutTypeId,
    projectId: fixtureIds.project,
    parentTypeId: null,
    category: "motion",
    name: "ease-in-out",
    kind: "primitive",
  },
];

export const validSeed: SeedData = {
  users: [
    {
      id: fixtureIds.user,
      email: "developer@example.test",
      passwordHash: "fake-seed-hash",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  projects: [
    {
      id: fixtureIds.project,
      slug: "design-system",
      name: "Design System",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  projectMembers: [
    {
      projectId: fixtureIds.project,
      userId: fixtureIds.user,
      role: "publisher",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  tokenTypes,
  tokens: [
    ...primitiveColorTokens,
    ...primitiveLightColorTokens,
    ...semanticColorTokens,
    ...typographyPrimitiveTokens,
    ...typographySemanticTokens,
    ...motionTokens,
  ],
  tokenReferences: [...colorReferences, ...typographyReferences],
  components: [
    {
      id: fixtureIds.component,
      projectId: fixtureIds.project,
      name: "Button",
      slug: "button",
      description: "Button component",
      documentPath: "components/button.md",
    },
  ],
  documentTemplates: [
    {
      id: fixtureIds.documentTemplate,
      projectId: fixtureIds.project,
      componentId: fixtureIds.component,
      name: "Button documentation",
      content: "# Button",
    },
  ],
  releases: [
    {
      id: fixtureIds.release,
      projectId: fixtureIds.project,
      version: "1.0.0",
      status: "published",
      publishedAt: "2026-10-27T10:00:00.000Z",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
};
