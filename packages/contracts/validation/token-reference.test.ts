import type { Token, TokenReference, TokenType } from "@repo/contracts/type";
import { validateTokenReference } from "@repo/contracts/validation/token-reference";
import { describe, expect, it } from "vitest";

const projectId = "project-1";

function tokenType(
  id: string,
  category: TokenType["category"],
  kind: TokenType["kind"],
  name = id,
  currentProjectId = projectId,
): TokenType {
  return {
    id,
    projectId: currentProjectId,
    category,
    kind,
    name,
    parentTypeId: null,
  };
}

function singleToken(
  id: string,
  tokenTypeId: string,
  currentProjectId = projectId,
): Token {
  return {
    id,
    projectId: currentProjectId,
    tokenTypeId,
    name: id,
    cssVar: `--${id}`,
    value: {
      kind: "scalar",
      value: "1rem",
    },
  };
}

function modeToken(id: string, tokenTypeId: string, currentProjectId = projectId): Token {
  return {
    id,
    projectId: currentProjectId,
    tokenTypeId,
    name: id,
    cssVar: `--${id}`,
    value: {
      kind: "modes",
      light: "#ffffff",
      dark: "#000000",
    },
  };
}

function reference(
  referencingTokenId: string,
  referencedTokenId: string,
  slot: TokenReference["slot"],
): TokenReference {
  return {
    referencingTokenId,
    referencedTokenId,
    slot,
  };
}

describe("validateTokenReference", () => {
  it("accepts a valid color light reference", () => {
    const types = [
      tokenType("surface", "color", "semantic"),
      tokenType("white", "color", "primitive"),
    ];

    const tokens = [
      modeToken("surface-token", "surface"),
      modeToken("white-token", "white"),
    ];

    const errors = validateTokenReference(
      reference("surface-token", "white-token", "light"),
      tokens,
      types,
      projectId,
    );

    expect(errors).toEqual([]);
  });

  it("accepts a valid spacing value reference", () => {
    const types = [
      tokenType("space", "spacing", "semantic"),
      tokenType("space-primitive", "spacing", "primitive"),
    ];

    const tokens = [
      singleToken("space-token", "space"),
      singleToken("space-primitive-token", "space-primitive"),
    ];

    const errors = validateTokenReference(
      reference("space-token", "space-primitive-token", "value"),
      tokens,
      types,
      projectId,
    );

    expect(errors).toEqual([]);
  });

  it("rejects a missing referencing token", () => {
    const types = [tokenType("color", "color", "primitive")];
    const tokens = [modeToken("white-token", "color")];

    const errors = validateTokenReference(
      reference("missing-token", "white-token", "light"),
      tokens,
      types,
      projectId,
    );

    expect(errors.some((error) => error.code === "missing-referencing-token")).toBe(true);
  });

  it("rejects a missing referenced token", () => {
    const types = [tokenType("color", "color", "semantic")];
    const tokens = [modeToken("surface-token", "color")];

    const errors = validateTokenReference(
      reference("surface-token", "missing-token", "light"),
      tokens,
      types,
      projectId,
    );

    expect(errors.some((error) => error.code === "missing-referenced-token")).toBe(true);
  });

  it("rejects a self-reference", () => {
    const types = [tokenType("color", "color", "primitive")];
    const tokens = [modeToken("color-token", "color")];

    const errors = validateTokenReference(
      reference("color-token", "color-token", "light"),
      tokens,
      types,
      projectId,
    );

    expect(errors.some((error) => error.code === "self-reference")).toBe(true);
  });

  it("rejects an unsupported slot", () => {
    const types = [tokenType("space", "spacing", "semantic")];
    const tokens = [singleToken("space-token", "space")];

    const errors = validateTokenReference(
      reference("space-token", "space-token", "light"),
      tokens,
      types,
      projectId,
    );

    expect(errors.some((error) => error.code === "unsupported-slot")).toBe(true);
  });

  it("rejects an incompatible referenced token type", () => {
    const types = [
      tokenType("surface", "color", "semantic"),
      tokenType("space", "spacing", "primitive"),
    ];

    const tokens = [
      modeToken("surface-token", "surface"),
      singleToken("space-token", "space"),
    ];

    const errors = validateTokenReference(
      reference("surface-token", "space-token", "light"),
      tokens,
      types,
      projectId,
    );

    expect(
      errors.some((error) => error.code === "incompatible-referenced-token-type"),
    ).toBe(true);
  });

  it("rejects tokens from another project", () => {
    const types = [
      tokenType("surface", "color", "semantic"),
      tokenType("white", "color", "primitive"),
    ];

    const tokens = [
      modeToken("surface-token", "surface"),
      modeToken("white-token", "white", "project-2"),
    ];

    const errors = validateTokenReference(
      reference("surface-token", "white-token", "light"),
      tokens,
      types,
      projectId,
    );

    expect(errors.some((error) => error.code === "wrong-project")).toBe(true);
  });

  it("rejects an invalid slot", () => {
    const types = [tokenType("color", "color", "semantic")];
    const tokens = [modeToken("color-token", "color")];

    const invalidReference = {
      referencingTokenId: "color-token",
      referencedTokenId: "color-token",
      slot: "invalid",
    } as unknown as TokenReference;

    const errors = validateTokenReference(invalidReference, tokens, types, projectId);

    expect(errors.some((error) => error.code === "invalid-slot")).toBe(true);
  });
});
