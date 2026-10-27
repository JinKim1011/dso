import type { Token, TokenType } from "@repo/contracts/type";
import { validateTokenDomain } from "@repo/contracts/validation/token-domain";
import { describe, expect, it } from "vitest";

const tokenType: TokenType = {
  id: "type-1",
  projectId: "project-1",
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
};

const token: Token = {
  id: "token-1",
  projectId: "project-1",
  tokenTypeId: "type-1",
  name: "neutral-0",
  cssVar: "--neutral-0",
  value: {
    kind: "single",
    value: "#fff",
  },
};

const missingTypeToken: Token = {
  id: "token-1",
  projectId: "project-1",
  tokenTypeId: "missing-type",
  name: "neutral-0",
  cssVar: null,
  value: {
    kind: "single",
    value: "#fff",
  },
};

describe("validateTokenDomain", () => {
  it("accepts tokens whose type belongs to the same project", () => {
    expect(validateTokenDomain([token], [tokenType], "project-1")).toEqual([]);
  });

  it("rejects a token with a missing token type", () => {
    expect(validateTokenDomain([missingTypeToken], [], "project-1")).toContainEqual(
      expect.objectContaining({ code: "missing-token-type" }),
    );
  });

  it("rejects duplicate token types", () => {
    expect(
      validateTokenDomain([token], [tokenType, tokenType], "project-1"),
    ).toContainEqual(expect.objectContaining({ code: "duplicate-token-type" }));
  });

  it("rejects duplicate tokens", () => {
    expect(validateTokenDomain([token, token], [tokenType], "project-1")).toContainEqual(
      expect.objectContaining({ code: "duplicate-token" }),
    );
  });

  it("rejects a token belonging to another project", () => {
    const foreignToken = { ...token, projectId: "project-2" };
    expect(validateTokenDomain([foreignToken], [tokenType], "project-1")).toContainEqual(
      expect.objectContaining({
        code: "wrong-project",
        entityId: token.id,
      }),
    );
  });

  it.each(["class-union", "unknown"])("rejects the %s kind", (kind) => {
    const invalidType: TokenType = {
      ...tokenType,
      // @ts-expect-error Exercise unsupported kinds received at runtime.
      kind,
    };
    expect(validateTokenDomain([token], [invalidType], "project-1")).toContainEqual({
      code: "unsupported-token-kind",
      entityId: tokenType.id,
      message: `Token type "${tokenType.id}" has an unsupported kind.`,
    });
  });
});
