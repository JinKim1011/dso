//  represents small, focused domain fixtures for unit tests.

import { fixtureIds } from "@repo/contracts/fixtures/ids";
import type { Token, TokenType } from "@repo/contracts/type";

export const primitiveTokenType = {
  id: fixtureIds.domain.primitiveTokenType,
  projectId: fixtureIds.domain.project,
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
} satisfies TokenType;

export const semanticTokenType = {
  id: fixtureIds.domain.semanticTokenType,
  projectId: fixtureIds.domain.project,
  parentTypeId: fixtureIds.domain.primitiveTokenType,
  category: "color",
  name: "Semantic",
  kind: "semantic",
} satisfies TokenType;

export const baseColorToken = {
  id: fixtureIds.domain.singleToken,
  projectId: fixtureIds.domain.project,
  tokenTypeId: fixtureIds.domain.primitiveTokenType,
  name: "white",
  cssVar: "--color-white",
  value: {
    kind: "single",
    value: "#ffffff",
  },
} satisfies Token;

export const modeToken = {
  id: fixtureIds.domain.modeToken,
  projectId: fixtureIds.domain.project,
  tokenTypeId: fixtureIds.domain.semanticTokenType,
  name: "surface",
  cssVar: "--color-surface",
  value: {
    kind: "modes",
    light: "#ffffff",
    dark: "#111111",
  },
} satisfies Token;
