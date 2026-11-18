import { redactSensitiveFields } from "@repo/application/security/redaction";
import { describe, expect, it } from "vitest";

describe("redactSensitiveFields", () => {
  it("redacts sensitive fields", () => {
    const result = redactSensitiveFields({
      email: "user@example.com",
      password: "correct-password",
      secret: "api-key-secret",
      sessionId: "session-123",
    });

    expect(result).toEqual({
      email: "user@example.com",
      password: "[REDACTED]",
      secret: "[REDACTED]",
      sessionId: "[REDACTED]",
    });
  });

  it("preserves non-sensitive fields", () => {
    const result = redactSensitiveFields({
      email: "user@example.com",
      projectId: "project-123",
      scope: "read",
    });

    expect(result).toEqual({
      email: "user@example.com",
      projectId: "project-123",
      scope: "read",
    });
  });

  it("does not mutate the original object", () => {
    const input = {
      password: "original-password",
      email: "user@example.com",
    };

    const result = redactSensitiveFields(input);

    expect(input.password).toBe("original-password");
    expect(result.password).toBe("[REDACTED]");
  });

  it("redacts authorization and cookie values", () => {
    const result = redactSensitiveFields({
      authorization: "Bearer token",
      cookie: "session=secret",
    });

    expect(result).toEqual({
      authorization: "[REDACTED]",
      cookie: "[REDACTED]",
    });
  });
});
