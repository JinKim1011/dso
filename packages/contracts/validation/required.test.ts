import { validateRequiredString } from "@repo/contracts/validation/required";
import { describe, expect, it } from "vitest";

describe("validateRequiredString", () => {
  it("accepts a non-empty string", () => {
    expect(validateRequiredString("project-1", "Project ID")).toEqual({
      success: true,
      value: "project-1",
    });
  });

  it("rejects non-strings", () => {
    expect(validateRequiredString(123, "Project ID")).toEqual({
      success: false,
      error: {
        code: "not-string",
        message: "Project ID must be a string.",
      },
    });
  });

  it("rejects empty strings", () => {
    expect(validateRequiredString("   ", "Project ID")).toEqual({
      success: false,
      error: {
        code: "empty",
        message: "Project ID cannot be empty.",
      },
    });
  });

  it("rejects control characters", () => {
    expect(validateRequiredString("project\0", "Project ID")).toEqual({
      success: false,
      error: {
        code: "unsafe-character",
        message: "Project ID contains an unsafe control character.",
      },
    });
  });
});
