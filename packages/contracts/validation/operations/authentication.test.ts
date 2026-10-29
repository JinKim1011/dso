import { parseLoginRequest } from "@repo/contracts/validation/operations/authentication";
import { describe, expect, it } from "vitest";

describe("LoginRequest operation parsers", () => {
  it("parses login requests and validates email and password", () => {
    expect(
      parseLoginRequest({
        email: "developer@example.test",
        password: "not-a-real-password",
      }),
    ).toEqual({
      success: true,
      value: {
        email: "developer@example.test",
        password: "not-a-real-password",
      },
    });

    expect(parseLoginRequest({ email: "invalid", password: "secret" })).toMatchObject({
      success: false,
      issues: [{ field: "email", code: "invalid-format" }],
    });
  });
});
