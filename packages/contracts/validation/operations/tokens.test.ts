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
});
