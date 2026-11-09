import type { Token, TokenType } from "@repo/contracts/type";
import { describe, expect, it } from "vitest";
import { buildTokenGraphViewModel } from "./build-token-graph-view-model";

describe("buildTokenGraphViewModel", () => {
  it("builds the graph view model from the token fixture", () => {
    const colorBaseType: TokenType = {
      id: "color-base",
      projectId: "project",
      parentTypeId: null,
      category: "color",
      name: "Base",
      kind: "primitive",
    };
    const typographyType: TokenType = {
      id: "typography-semantic",
      projectId: "project",
      parentTypeId: null,
      category: "typography",
      name: "Typography",
      kind: "semantic",
    };
    const tokenTypes = [typographyType, colorBaseType];
    const tokens: Token[] = [
      {
        id: "color-neutral-0",
        projectId: colorBaseType.projectId,
        tokenTypeId: colorBaseType.id,
        name: "neutral-0",
        cssVar: "--base-neutral-0",
        value: { kind: "single", value: "oklch(98.5% 0 0)" },
      },
      {
        id: "color-surface",
        projectId: colorBaseType.projectId,
        tokenTypeId: colorBaseType.id,
        name: "surface",
        cssVar: "--color-surface",
        value: {
          kind: "modes",
          light: "var(--base-neutral-0)",
          dark: "var(--base-neutral-900)",
        },
      },
      {
        id: "typography-body",
        projectId: typographyType.projectId,
        tokenTypeId: typographyType.id,
        name: "body",
        cssVar: null,
        value: {
          kind: "typography",
          fontSize: "var(--text-regular)",
          fontWeight: "var(--font-regular)",
          lineHeight: "var(--leading-relaxed)",
        },
      },
    ];

    const viewModel = buildTokenGraphViewModel(tokenTypes, tokens);

    // color category related
    const modeToken = viewModel.tokenTypes
      .flatMap(({ values }) => values)
      .find(({ name }) => name === "surface");
    const colorType = viewModel.tokenTypes.find(
      (tokenType) => tokenType.category === "color",
    );
    const colorToken = colorType?.values.find(({ name }) => name === "neutral-0");

    // typography category related
    const typographyToken = viewModel.tokenTypes
      .flatMap(({ values }) => values)
      .find(({ name }) => name === "body");

    expect(viewModel.schemaVersion).toBe(1);
    expect(viewModel.root).toEqual({
      id: "root",
      label: "Design Tokens",
    });
    expect(viewModel.categories).toEqual([
      {
        id: "category:color",
        category: "color",
        tokenTypeIds: tokenTypes
          .filter((tokenType) => tokenType.category === "color")
          .map((tokenType) => tokenType.id)
          .sort(),
      },
      {
        id: "category:typography",
        category: "typography",
        tokenTypeIds: tokenTypes
          .filter((tokenType) => tokenType.category === "typography")
          .map((tokenType) => tokenType.id)
          .sort(),
      },
    ]);
    expect(viewModel.tokenTypes.map(({ id }) => id)).toEqual(
      [...tokenTypes]
        .sort(
          (a, b) =>
            a.category.localeCompare(b.category) ||
            a.name.localeCompare(b.name) ||
            a.kind.localeCompare(b.kind),
        )
        .map(({ id }) => id),
    );
    expect(colorToken).toMatchObject({
      name: "neutral-0",
      cssVar: "--base-neutral-0",
      value: {
        kind: "single",
        value: "oklch(98.5% 0 0)",
      },
      meta: "oklch(98.5% 0 0)",
      preview: {
        kind: "single",
        value: "oklch(98.5% 0 0)",
      },
    });
    expect(modeToken).toMatchObject({
      name: "surface",
      meta: "light:var(--base-neutral-0) dark:var(--base-neutral-900)",
      preview: {
        kind: "modes",
        light: "var(--base-neutral-0)",
        dark: "var(--base-neutral-900)",
      },
    });
    expect(typographyToken).toMatchObject({
      name: "body",
      meta: "var(--text-regular) / var(--font-regular) / var(--leading-relaxed)",
      preview: {
        kind: "typography",
        typography: {
          fontSize: "var(--text-regular)",
          fontWeight: "var(--font-regular)",
          lineHeight: "var(--leading-relaxed)",
        },
      },
    });
  });
});
