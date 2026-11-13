//  represents small, focused domain fixtures for unit tests.

import { fixtureIds } from "@repo/contracts/fixtures/ids";
import type { Token, TokenType } from "@repo/contracts/type";

export const primitiveTokenType = {
  id: fixtureIds.primitiveTokenType,
  projectId: fixtureIds.project,
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
} satisfies TokenType;

export const semanticTokenType = {
  id: fixtureIds.semanticTokenType,
  projectId: fixtureIds.project,
  parentTypeId: fixtureIds.primitiveTokenType,
  category: "color",
  name: "Semantic",
  kind: "semantic",
} satisfies TokenType;

export const baseColorToken = {
  id: fixtureIds.singleToken,
  projectId: fixtureIds.project,
  tokenTypeId: fixtureIds.primitiveTokenType,
  name: "white",
  cssVar: "--color-white",
  value: {
    kind: "single",
    value: "#ffffff",
  },
} satisfies Token;

export const modeToken = {
  id: fixtureIds.modeToken,
  projectId: fixtureIds.project,
  tokenTypeId: fixtureIds.semanticTokenType,
  name: "surface",
  cssVar: "--color-surface",
  value: { kind: "modes" },
} satisfies Token;
