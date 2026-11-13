import { updateTokenRequest } from "@repo/contracts/fixtures/operation-contracts";
import { parseUpdateTokenRequest } from "@repo/contracts/validation/operations/tokens";
import { describe, expect, it } from "vitest";

describe("UpdateTokenRequest operation parsers", () => {
  it("parses token updates, including nested token values", () => {
    expect(parseUpdateTokenRequest(updateTokenRequest)).toMatchObject({
      success: true,
      value: updateTokenRequest,
    });

    expect(
      parseUpdateTokenRequest({
        ...updateTokenRequest,
        value: { kind: "single", value: 42 },
      }),
    ).toMatchObject({
      success: false,
      issues: [{ field: "value.value", code: "invalid-type" }],
    });
  });

  it.each([
    { kind: "modes", light: "#fff" },
    { kind: "modes", dark: "var(--old)" },
    { kind: "typography", fontSize: "1rem" },
    { kind: "typography", fontWeight: "400" },
    { kind: "typography", lineHeight: "1.5" },
  ])("rejects semantic slot values: %o", (value) => {
    expect(parseUpdateTokenRequest({ ...updateTokenRequest, value })).toMatchObject({
      success: false,
      issues: [{ field: "value", code: "unknown-field" }],
    });
  });

  it.each([{ kind: "modes" }, { kind: "typography" }])(
    "accepts empty semantic values: %o",
    (value) => {
      expect(parseUpdateTokenRequest({ ...updateTokenRequest, value })).toMatchObject({
        success: true,
      });
    },
  );
});
