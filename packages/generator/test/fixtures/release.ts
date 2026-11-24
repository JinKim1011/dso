import type { PublishedReleaseResponse } from "@repo/contracts/operation";

const projectId = "00000000-0000-4000-8000-000000000010";

const ids = {
  release: "00000000-0000-4000-8000-000000000020",
  primitiveColorType: "00000000-0000-4000-8000-000000000101",
  semanticColorType: "00000000-0000-4000-8000-000000000102",
  primitiveFontSizeType: "00000000-0000-4000-8000-000000000103",
  primitiveFontWeightType: "00000000-0000-4000-8000-000000000104",
  primitiveLineHeightType: "00000000-0000-4000-8000-000000000105",
  semanticTypographyType: "00000000-0000-4000-8000-000000000106",
  neutral0: "00000000-0000-4000-8000-000000000201",
  neutral900: "00000000-0000-4000-8000-000000000202",
  fontSizeTitle: "00000000-0000-4000-8000-000000000203",
  fontWeightBold: "00000000-0000-4000-8000-000000000204",
  lineHeightTight: "00000000-0000-4000-8000-000000000205",
  surface: "00000000-0000-4000-8000-000000000206",
  surfaceLightOnly: "00000000-0000-4000-8000-000000000207",
  headingStrong: "00000000-0000-4000-8000-000000000208",
  unresolved: "00000000-0000-4000-8000-000000000209",
} as const;

const tokenTypes = [
  {
    id: ids.primitiveColorType,
    projectId,
    parentTypeId: null,
    category: "color",
    name: "Base",
    kind: "primitive",
  },
  {
    id: ids.semanticColorType,
    projectId,
    parentTypeId: ids.primitiveColorType,
    category: "color",
    name: "surface",
    kind: "semantic",
  },
  {
    id: ids.primitiveFontSizeType,
    projectId,
    parentTypeId: null,
    category: "typography",
    name: "font-size",
    kind: "primitive",
  },
  {
    id: ids.primitiveFontWeightType,
    projectId,
    parentTypeId: null,
    category: "typography",
    name: "font-weight",
    kind: "primitive",
  },
  {
    id: ids.primitiveLineHeightType,
    projectId,
    parentTypeId: null,
    category: "typography",
    name: "line-height",
    kind: "primitive",
  },
  {
    id: ids.semanticTypographyType,
    projectId,
    parentTypeId: null,
    category: "typography",
    name: "typography",
    kind: "semantic",
  },
] as const;

export const generatorReleaseFixture = {
  schemaVersion: 1,
  release: {
    id: ids.release,
    projectId,
    version: "1",
    status: "published",
    createdAt: "2026-11-20T10:00:00.000Z",
    publishedAt: "2026-11-20T10:05:00.000Z",
  },
  tokenTypes: [...tokenTypes],
  // Deliberately unsorted: the generator must not preserve input order.
  tokens: [
    // Legacy release cssVar fields intentionally model ignored snapshot data.
    {
      id: ids.surface,
      projectId,
      tokenTypeId: ids.semanticColorType,
      name: "surface",
      cssVar: "--color-surface",
      value: { kind: "modes" },
    },
    {
      id: ids.neutral900,
      projectId,
      tokenTypeId: ids.primitiveColorType,
      name: "neutral-900",
      cssVar: "--base-neutral-900",
      value: { kind: "single", value: "oklch(14.5% 0 0)" },
    },
    {
      id: ids.headingStrong,
      projectId,
      tokenTypeId: ids.semanticTypographyType,
      name: "heading-strong",
      cssVar: null,
      value: { kind: "typography" },
    },
    {
      id: ids.neutral0,
      projectId,
      tokenTypeId: ids.primitiveColorType,
      name: "neutral-0",
      cssVar: "--base-neutral-0",
      value: { kind: "single", value: "oklch(98.5% 0 0)" },
    },
    {
      id: ids.lineHeightTight,
      projectId,
      tokenTypeId: ids.primitiveLineHeightType,
      name: "tight",
      cssVar: "--leading-tight",
      value: { kind: "single", value: "1.3" },
    },
    {
      id: ids.fontWeightBold,
      projectId,
      tokenTypeId: ids.primitiveFontWeightType,
      name: "bold",
      cssVar: "--font-bold",
      value: { kind: "single", value: "700" },
    },
    {
      id: ids.fontSizeTitle,
      projectId,
      tokenTypeId: ids.primitiveFontSizeType,
      name: "title",
      cssVar: "--text-title",
      value: { kind: "single", value: "1.125rem" },
    },
    {
      id: ids.surfaceLightOnly,
      projectId,
      tokenTypeId: ids.semanticColorType,
      name: "surface-light-only",
      cssVar: "--color-surface-light-only",
      value: { kind: "modes" },
    },
  ],
  references: [
    {
      referencingTokenId: ids.surfaceLightOnly,
      referencedTokenId: ids.neutral0,
      projectId,
      slot: "light",
    },
    {
      referencingTokenId: ids.headingStrong,
      referencedTokenId: ids.fontWeightBold,
      projectId,
      slot: "fontWeight",
    },
    {
      referencingTokenId: ids.surface,
      referencedTokenId: ids.neutral900,
      projectId,
      slot: "dark",
    },
    {
      referencingTokenId: ids.headingStrong,
      referencedTokenId: ids.lineHeightTight,
      projectId,
      slot: "lineHeight",
    },
    {
      referencingTokenId: ids.surface,
      referencedTokenId: ids.neutral0,
      projectId,
      slot: "light",
    },
    {
      referencingTokenId: ids.headingStrong,
      referencedTokenId: ids.fontSizeTitle,
      projectId,
      slot: "fontSize",
    },
  ],
  components: [],
  templates: [],
} satisfies PublishedReleaseResponse;

export const unresolvedGeneratorReleaseFixture = {
  ...generatorReleaseFixture,
  tokens: [
    ...generatorReleaseFixture.tokens,
    {
      id: ids.unresolved,
      projectId,
      tokenTypeId: ids.semanticColorType,
      name: "unresolved-surface",
      cssVar: "--color-unresolved-surface",
      value: { kind: "unresolved" },
    },
  ],
} satisfies PublishedReleaseResponse;
