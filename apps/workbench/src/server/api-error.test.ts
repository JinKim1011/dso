import {
  ApiKeyScopeDeniedError,
  AuthenticationRequiredError,
  DomainValidationError,
  InvalidApiKeyCredentialError,
  InvalidCredentialsError,
  ProjectAccessDeniedError,
  ResourceNotFoundError,
  SessionExpiredError,
  StagedChangesConflictError,
  StagedChangesValidationError,
} from "@repo/application/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mapApiError } from "./api-error";
import { RequestBodyError } from "./request-body";

afterEach(() => vi.restoreAllMocks());

describe("API error mapper", () => {
  it.each([
    [new RequestBodyError("invalid-body", "Request body must be valid JSON."), 400],
    [new RequestBodyError("body-too-large", "Request body is too large."), 413],
    [new AuthenticationRequiredError(), 401],
    [new InvalidCredentialsError(), 401],
    [new InvalidApiKeyCredentialError(), 401],
    [new SessionExpiredError(), 401],
    [new ProjectAccessDeniedError(), 403],
    [new ApiKeyScopeDeniedError(), 403],
    [new ResourceNotFoundError(), 404],
  ])("maps known errors to stable responses: %s", async (error, status) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = mapApiError(error);

    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: error.code, message: error.message },
    });

    expect(log).not.toHaveBeenCalled();
  });

  it.each([
    [
      new StagedChangesConflictError([
        { code: "conflict", field: "name", tokenId: "token-id", message: "changed" },
      ]),
      409,
    ],
    [
      new StagedChangesValidationError([
        {
          code: "invalid-value",
          field: "value",
          tokenId: "token-id",
          message: "invalid",
        },
      ]),
      422,
    ],
    [new DomainValidationError([{ code: "invalid-reference", message: "invalid" }]), 422],
  ])("preserves validation details: %s", async (error, status) => {
    const response = mapApiError(error);

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: error.code, message: error.message, issues: error.issues },
    });
  });

  it.each([
    new Error(
      "database failure: credential dso_0011223344556677_secret authorization Bearer token key hash abcdef detail query failed",
    ),
    { password: "secret", message: "sensitive database failure" },
    "sensitive database failure",
  ])("logs a correlation ID without exposing unexpected errors", async (error) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = mapApiError(error);

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = await response.json();

    expect(body).toEqual({
      ok: false,
      error: {
        code: "internal-error",
        message: "The request could not be completed.",
        correlationId: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        ),
      },
    });
    expect(log).toHaveBeenCalledWith("Unhandled API error.", {
      correlationId: body.error.correlationId,
      errorType: error instanceof Error ? "Error" : typeof error,
    });
    expect(JSON.stringify({ body, logs: log.mock.calls })).not.toMatch(
      /credential|authorization|key.?hash|database failure|detail|sensitive|secret|password/i,
    );
  });

  it("uses a different correlation ID for each unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const first = await mapApiError(new Error()).json();
    const second = await mapApiError(new Error()).json();

    expect(first.error.correlationId).not.toBe(second.error.correlationId);
  });
});
