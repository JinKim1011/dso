import { validateDocumentPath } from "@repo/contracts/validation/document-path";
import { describe, expect, it } from "vitest";

describe("validateDocumentPath", () => {
  it("accepts a valid relative Markdown path", () => {
    expect(validateDocumentPath("components/button.md")).toBeNull();
  });

  it("rejects a non-string value", () => {
    expect(validateDocumentPath(null)?.code).toBe("not-string");
  });

  it("rejects an empty path", () => {
    expect(validateDocumentPath("   ")?.code).toBe("empty");
  });

  it("rejects an absolute Unix path", () => {
    expect(validateDocumentPath("/tmp/button.md")?.code).toBe("absolute-path");
  });

  it("rejects an absolute Windows path", () => {
    expect(validateDocumentPath("C:/project/button.md")?.code).toBe("absolute-path");
  });

  it("rejects backslash separators", () => {
    expect(validateDocumentPath("components\\button.md")?.code).toBe("backslash");
  });

  it("rejects parent-directory traversal", () => {
    expect(validateDocumentPath("../button.md")?.code).toBe("invalid-segment");
  });

  it("rejects traversal inside the path", () => {
    expect(validateDocumentPath("components/../button.md")?.code).toBe("invalid-segment");
  });

  it("rejects a non-Markdown extension", () => {
    expect(validateDocumentPath("components/button.json")?.code).toBe(
      "invalid-extension",
    );
  });

  it("rejects control characters", () => {
    expect(validateDocumentPath("components/\0button.md")?.code).toBe("unsafe-character");
  });

  it("rejects an empty path segment", () => {
    expect(validateDocumentPath("components//button.md")?.code).toBe("invalid-segment");
  });
});
