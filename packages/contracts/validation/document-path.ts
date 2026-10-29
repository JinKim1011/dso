import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";

export type DocumentPathValidationError = {
  code:
    | "not-string"
    | "empty"
    | "absolute-path"
    | "backslash"
    | "unsafe-character"
    | "too-long"
    | "invalid-extension"
    | "invalid-segment";
  message: string;
};

export function validateDocumentPath(value: unknown): DocumentPathValidationError | null {
  if (typeof value !== "string") {
    return {
      code: "not-string",
      message: "Document path must be a string.",
    };
  }

  if (value.trim().length === 0) {
    return {
      code: "empty",
      message: "Document path cannot be empty.",
    };
  }

  if (value.startsWith("/") || /^[A-Za-z]:/.test(value) || value.startsWith("//")) {
    return {
      code: "absolute-path",
      message: "Document path must be relateive.",
    };
  }

  if (value.includes("\\")) {
    return {
      code: "backslash",
      message: "Document path must use '/' separators.",
    };
  }

  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return {
      code: "unsafe-character",
      message: "Document path contains an unsafe control character.",
    };
  }

  if (value.length > CONTRACT_LIMITS.documentPath) {
    return {
      code: "too-long",
      message: "Document path cannot exceed 255 characters.",
    };
  }

  if (!value.endsWith(".md")) {
    return {
      code: "invalid-extension",
      message: "Document path must point to a Markdown file.",
    };
  }

  const segments = value.split("/");

  if (
    segments.some(
      (segment) => segment.length === 0 || segment === "." || segment === "..",
    )
  ) {
    return {
      code: "invalid-segment",
      message: "Document path contains an invalid path segments.",
    };
  }

  return null;
}
