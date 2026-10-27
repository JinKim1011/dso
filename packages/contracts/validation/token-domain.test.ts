import type { Token, TokenType } from "@repo/contracts/type";
import { validateTokenDomain } from "@repo/contracts/validation/token-domain";
import { describe, expect, it } from "vitest";

describe("validateTokenDomain", () => {
  it("accepts tokens whose type belongs to the same project", () => {
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

    expect(validateTokenDomain([token], [tokenType], "project-1")).toEqual([]);
  });

  it("rejects a token with a missing token type", () => {
    const token: Token = {
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

    const errors = validateTokenDomain([token], [], "project-1");

    expect(errors.some((error) => error.code === "missing-token-type")).toBe(true);
  });
});
