import type { Token, TokenType } from "@repo/contracts/type";
import {
  deriveTokenCssVariable,
  findTokenCssVariableConflicts,
  validateTokenName,
} from "@repo/contracts/validation/token-naming";
import { describe, expect, it } from "vitest";

function token(id: string, tokenTypeId: string, name: string): Token {
  return {
    id,
    projectId: "project",
    tokenTypeId,
    name,
    cssVar: null,
    value: { kind: "single", value: "1rem" },
  };
}

describe("token naming", () => {
  const component: TokenType = {
    id: "component",
    projectId: "project",
    parentTypeId: null,
    category: "radius",
    name: "component",
    kind: "semantic",
  };
  const modal: TokenType = {
    id: "modal",
    projectId: "project",
    parentTypeId: component.id,
    category: "radius",
    name: "modal",
    kind: "semantic",
  };
  const card: TokenType = {
    id: "card",
    projectId: "project",
    parentTypeId: component.id,
    category: "radius",
    name: "card",
    kind: "semantic",
  };
  const typeIndex = new Map([
    [component.id, component],
    [modal.id, modal],
    [card.id, card],
  ]);

  it("uses the semantic hierarchy to distinguish same final segments", () => {
    expect(deriveTokenCssVariable(token("a", modal.id, "small"), modal, typeIndex)).toBe(
      "--radius-component-modal-small",
    );
    expect(deriveTokenCssVariable(token("b", card.id, "small"), card, typeIndex)).toBe(
      "--radius-component-card-small",
    );
  });

  it.each(["small", "hover-strong", "2xlarge"])(
    "accepts canonical final segment %s",
    (name) => {
      expect(validateTokenName(name)).toBeNull();
    },
  );

  it.each(["Small", "small inset", "-small", "small-", "small--large"])(
    "rejects non-canonical final segment %s",
    (name) => {
      expect(validateTokenName(name)).toBe(
        "Use lowercase letters, numbers, and single hyphens.",
      );
    },
  );

  it("reports conflicts after generated paths are normalized", () => {
    const tokens = [token("a", modal.id, "small"), token("b", modal.id, " small ")];

    expect(findTokenCssVariableConflicts(tokens, typeIndex)).toEqual(
      new Map([["--radius-component-modal-small", ["a", "b"]]]),
    );
  });
});
