import type { StagedChangesDomainIssue } from "@repo/contracts/validation/operations/staged-changes-domain";

export class AuthenticationRequiredError extends Error {
  readonly code = "authentication-required";

  constructor() {
    super("Authentication is required.");
  }
}

export class ProjectAccessDeniedError extends Error {
  readonly code = "project-access-denied";

  constructor() {
    super("You are not authorized to access this project.");
  }
}

export class DomainValidationError extends Error {
  readonly code = "domain-validation";

  constructor(readonly issues: readonly { code: string; message: string }[]) {
    super("The requested operation is not valid.");
  }
}

export class StagedChangesValidationError extends DomainValidationError {
  constructor(readonly issues: readonly StagedChangesDomainIssue[]) {
    super(issues);
  }
}

export class StagedChangesConflictError extends Error {
  readonly code = "staged-changes-conflict";

  constructor(readonly issues: readonly StagedChangesDomainIssue[]) {
    super("The staged changes conflict with current project data.");
  }
}

export class ResourceNotFoundError extends Error {
  readonly code = "resource-not-found";

  constructor() {
    super("The requested resource was not found.");
  }
}

export class InvalidCredentialsError extends Error {
  readonly code = "invalid-credentials";

  constructor() {
    super("Invalid email or password.");
  }
}

export class SessionExpiredError extends Error {
  readonly code = "session-expired";

  constructor() {
    super("The session is expired or invalid.");
  }
}
