import type { Token, TokenType } from "@repo/contracts/type";
import { deriveCssVariable } from "@repo/generator/css-variable";
import { describe, expect, it } from "vitest";

function token(name: string): Token {
  return {
    id: crypto.randomUUID(),
    projectId: crypto.randomUUID(),
    tokenTypeId: crypto.randomUUID(),
    name,
    cssVar: "ignored-legacy-value",
    value: { kind: "single", value: "literal" },
  };
}

function tokenType(
  category: TokenType["category"],
  name: string,
  kind: TokenType["kind"],
): TokenType {
  return {
    id: crypto.randomUUID(),
    projectId: crypto.randomUUID(),
    parentTypeId: null,
    category,
    name,
    kind,
  };
}

describe("deriveCssVariable", () => {
  it.each([
    ["neutral-0", tokenType("color", "Base", "primitive"), "--base-neutral-0"],
    ["surface", tokenType("color", "surface", "semantic"), "--color-surface"],
    ["small inset", tokenType("shadow", "shadow", "semantic"), "--shadow-small-inset"],
    ["sm", tokenType("spacing", "space", "primitive"), "--sm"],
    ["title", tokenType("typography", "font-size", "primitive"), "--text-title"],
    ["bold", tokenType("typography", "font-weight", "primitive"), "--font-bold"],
    ["tight", tokenType("typography", "line-height", "primitive"), "--leading-tight"],
    ["ease-in-quad", tokenType("motion", "ease-in", "primitive"), "--ease-in-quad"],
  ])("derives %s from token data", (name, type, expected) => {
    expect(deriveCssVariable(token(name), type, new Map([[type.id, type]]))).toBe(
      expected,
    );
  });

  it("does not derive a custom property for semantic typography", () => {
    const type = tokenType("typography", "Typography", "semantic");
    expect(
      deriveCssVariable(token("heading-strong"), type, new Map([[type.id, type]])),
    ).toBeNull();
  });

  it("includes semantic token type ancestors in the generated path", () => {
    const projectId = crypto.randomUUID();
    const component: TokenType = {
      ...tokenType("radius", "component", "semantic"),
      id: crypto.randomUUID(),
      projectId,
    };
    const modal: TokenType = {
      ...tokenType("radius", "modal", "semantic"),
      id: crypto.randomUUID(),
      projectId,
      parentTypeId: component.id,
    };
    const types = new Map([
      [component.id, component],
      [modal.id, modal],
    ]);
    const value = { ...token("small"), tokenTypeId: modal.id, projectId };

    expect(deriveCssVariable(value, modal, types)).toBe("--radius-component-modal-small");
  });

  it("does not include primitive parents in a semantic path", () => {
    const primitive = tokenType("color", "Base", "primitive");
    const semantic = {
      ...tokenType("color", "content", "semantic"),
      parentTypeId: primitive.id,
    };

    expect(
      deriveCssVariable(
        token("primary"),
        semantic,
        new Map([
          [primitive.id, primitive],
          [semantic.id, semantic],
        ]),
      ),
    ).toBe("--color-content-primary");
  });
});
