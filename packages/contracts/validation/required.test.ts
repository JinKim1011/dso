import { validateRequiredString } from "@repo/contracts/validation/required";
import { describe, expect, it } from "vitest";

describe("validateRequiredString", () => {
  it("accepts a non-empty string", () => {
    expect(validateRequiredString("project-1", "Project ID")).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(validateRequiredString(123, "Project ID")?.code).toBe("not-string");
  });

  it("rejects empty strings", () => {
    expect(validateRequiredString("   ", "Project ID")?.code).toBe("empty");
  });

  it("rejects control characters", () => {
    expect(validateRequiredString("project\0", "Project ID")?.code).toBe(
      "unsafe-character",
    );
  });
});
