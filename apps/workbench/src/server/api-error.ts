import { RequestBodyError } from "@/server/request-body";
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
} from "@repo/application/errors";

function failure(
  status: number,
  error: {
    code: string;
    message: string;
    issues?: readonly { code: string; message: string }[];
    correlationId?: string;
  },
): Response {
  return Response.json(
    { ok: false, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function mapApiError(error: unknown): Response {
  if (error instanceof RequestBodyError) {
    return failure(error.code === "body-too-large" ? 413 : 400, {
      code: error.code,
      message: error.message,
    });
  }

  if (
    error instanceof AuthenticationRequiredError ||
    error instanceof InvalidCredentialsError ||
    error instanceof InvalidApiKeyCredentialError ||
    error instanceof SessionExpiredError
  ) {
    return failure(401, { code: error.code, message: error.message });
  }

  if (
    error instanceof ProjectAccessDeniedError ||
    error instanceof ApiKeyScopeDeniedError
  ) {
    return failure(403, { code: error.code, message: error.message });
  }

  if (error instanceof ResourceNotFoundError) {
    return failure(404, { code: error.code, message: error.message });
  }

  if (error instanceof StagedChangesConflictError) {
    return failure(409, {
      code: error.code,
      message: error.message,
      issues: error.issues,
    });
  }

  if (error instanceof DomainValidationError) {
    return failure(422, {
      code: error.code,
      message: error.message,
      issues: error.issues,
    });
  }

  const correlationId = crypto.randomUUID();
  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;

  console.error("Unhandled API error.", {
    correlationId,
    errorType: error instanceof Error ? "Error" : typeof error,
    ...(errorCode ? { errorCode } : {}),
  });

  return failure(500, {
    code: "internal-error",
    message: "The request could not be completed.",
    correlationId,
  });
}
