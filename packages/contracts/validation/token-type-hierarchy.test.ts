import type { TokenType } from "@repo/contracts/type";
import { validateTokenTypeHierarchy } from "@repo/contracts/validation/token-type-hierarchy";
import { describe, expect, it } from "vitest";

const projectId = "project-1";

function tokenType(
  id: string,
  parentTypeId: string | null = null,
  currentProjectId = projectId,
): TokenType {
  return {
    id,
    projectId: currentProjectId,
    category: "color",
    name: id,
    kind: "semantic",
    parentTypeId,
  };
}

describe("validateTokenTypeHierarchy", () => {
  it("accepts a root token type", () => {
    const errors = validateTokenTypeHierarchy([tokenType("color")], projectId);

    expect(errors).toEqual([]);
  });

  it("accepts a valid parent chain", () => {
    const errors = validateTokenTypeHierarchy(
      [
        tokenType("base"),
        tokenType("surface", "base"),
        tokenType("interactive", "surface"),
      ],
      projectId,
    );

    expect(errors).toEqual([]);
  });

  it("rejects duplicate token type IDs", () => {
    const errors = validateTokenTypeHierarchy(
      [tokenType("base"), tokenType("base")],
      projectId,
    );

    expect(errors.some((error) => error.code === "duplicate-id")).toBe(true);
  });

  it("rejects a token type from another project", () => {
    const errors = validateTokenTypeHierarchy(
      [tokenType("base", null, "project-2")],
      projectId,
    );

    expect(errors.some((error) => error.code === "wrong-project")).toBe(true);
  });

  it("rejects a missing parent", () => {
    const errors = validateTokenTypeHierarchy(
      [tokenType("surface", "missing-parent")],
      projectId,
    );

    expect(errors.some((error) => error.code === "missing-parent")).toBe(true);
  });

  it("rejects a token type as its own parent", () => {
    const errors = validateTokenTypeHierarchy([tokenType("base", "base")], projectId);

    expect(errors.some((error) => error.code === "self-parent")).toBe(true);
  });

  it("rejects a parent from another project", () => {
    const errors = validateTokenTypeHierarchy(
      [tokenType("base", null, "project-2"), tokenType("surface", "base", projectId)],
      projectId,
    );

    expect(errors.some((error) => error.code === "cross-project-parent")).toBe(true);
  });

  it("rejects a two-node cycle", () => {
    const errors = validateTokenTypeHierarchy(
      [tokenType("base", "surface"), tokenType("surface", "base")],
      projectId,
    );

    expect(errors.some((error) => error.code === "cycle")).toBe(true);
  });

  it("rejects a longer cycle", () => {
    const errors = validateTokenTypeHierarchy(
      [tokenType("a", "c"), tokenType("b", "a"), tokenType("c", "b")],
      projectId,
    );

    expect(errors.some((error) => error.code === "cycle")).toBe(true);
  });
});
