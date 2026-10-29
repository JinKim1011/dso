import { parseUpdateTokenRequest } from "@repo/contracts/validation/operations/tokens";
import { describe, expect, it } from "vitest";

describe("UpdateTokenRequest operation parsers", () => {
  it("parses token updates, including nested token values", () => {
    expect(
      parseUpdateTokenRequest({
        projectId: "project-1",
        tokenId: "token-1",
        name: "Surface",
        cssVar: "--surface",
        value: { kind: "modes", light: "#fff", dark: "#000" },
      }),
    ).toMatchObject({ success: true });

    expect(
      parseUpdateTokenRequest({
        projectId: "project-1",
        tokenId: "token-1",
        name: "Surface",
        cssVar: null,
        value: { kind: "single", value: 42 },
      }),
    ).toMatchObject({
      success: false,
      issues: [{ field: "value.value", code: "invalid-type" }],
    });
  });
});
