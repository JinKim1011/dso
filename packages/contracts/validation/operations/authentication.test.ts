import { loginRequest } from "@repo/contracts/fixtures/operation-contracts";
import { parseLoginRequest } from "@repo/contracts/validation/operations/authentication";
import { describe, expect, it } from "vitest";

describe("LoginRequest operation parsers", () => {
  it("parses login requests and validates email and password", () => {
    expect(parseLoginRequest(loginRequest)).toEqual({
      success: true,
      value: loginRequest,
    });

    expect(parseLoginRequest({ ...loginRequest, email: "invalid" })).toMatchObject({
      success: false,
      issues: [{ field: "email", code: "invalid-format" }],
    });
  });
});
