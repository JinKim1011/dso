# Threat model

## Actors

- Project editors: can modify project resources
- Project publishers: can publish releases
- Project admin: can manage users and API keys
- Database admin: has infrastructure-level access
- CLI users: can download authorized published releases
- Attackers: attempt unauthorized actions

## Assets

- Unpublished design tokens, components, and templates
- Published releases
- Passwords and sessions
- CLI API keys
- Database credentials
- Generated files
  - A shared asset at the DSO-to-consumer boundary
  - DSO is responsible for
    - validating release data
    - preventing unsafe paths
    - verifying signatures
    - generating deterministic output
  - consumer repository is responsible for
    - access control
    - review
    - storage
    - backup
    - operational handling
- Release signature and signing keys
  - An asset at the CLI-to-published-release-API boundary

## Entry points

- Login endpoint: need to protect password and rate limiting.
- Workbench API routes: need to protect browser-facing operation.
- Published-release API: need to protect release downloads and prevent unpublished access.
- CLI commands: need to protect local machine and generated files
- API-key configuration: need to protect the credential lifecycle
- Local output path used by generation: need to protect path traversal
- Database connection: need to protect the database and enforce data integrity

## Trust boundaries

The receiving side should not automatically trust data.

- Browser -> Workbench API : API validates browser input before saving it.
- Workbench API -> PostgreSQL : use parameterized queries and constraints.
- Published-release API -> CLI : verifies release signatures before generation.
- CLI -> Local repository : validates document paths before writing files.

## Data flows

### Browser -> Workbench API

```text
Browser
  -> HTTPS request
     - session cookie
     - CSRF token for mutations
     - project/resource changes
  -> Workbench API
```

- Main threats
  - CSRF
  - broken access control
  - XSS
  - malformed input
- Failure behavior
  - reject invalid requests
  - return generic errors
  - do not persist partial changeså

### Workbench API -> PostgreSQL

```text
Workbench API
  -> parameterized SQL
     - authenticated user context
     - project identifier
     - resource changes
  -> PostgreSQL
```

- Main threats
  - SQL injection
  - unauthorized cross-project access
  - credential leakage
  - partial updates
  - invalid token relationships
  - excessive database resource use
- Failure behavior
  - Reject unauthorized project access before executing protected queries.
  - Return a generic server error when the database is unavailable.
  - Do not expose SQL statements, database credentials, schema details, or stack traces.
  - Roll back the transaction when any staged update fails.
  - Do not persist partial token, reference, hierarchy, component, or template changes.
  - Apply query timeouts and request limits where appropriate.
  - Record operational errors without logging secrets or sensitive payloads.

### PostgreSQL -> Published-release API

```text
Published-release API
  -> parameterized release query
  -> PostgreSQL

PostgreSQL
  -> published release rows
  -> Published-release API
  -> canonicalization and Ed25519 signing
  -> CLI
```

PostgreSQL does not communicate directly with the CLI. The Published-release API queries PostgreSQL and receives the requested release data.

- Main threats
  - Unpublished or draft data is included in the response.
  - Data from another project is included in the response.
  - Incomplete or inconsistent release data is signed and returned.
  - Sensitive database fields appear in the release payload.
  - Malformed database content causes unsafe API or CLI behavior.
  - Database errors reveal schema details, credentials, or internal paths.
  - A very large release consumes excessive memory or processing time.
- Failure behavior
  - Return a safe not-found or authorization response when the release does not exist or is not accessible.
  - Never return draft or unpublished data.
  - Reject incomplete or invalid release data before signing it.
  - Do not sign or return a partially assembled release.
  - Return a generic server error when PostgreSQL is unavailable.
  - Do not expose database errors, credentials, SQL statements, or stack traces.
  - Reject releases that exceed configured size limits.

### CLI -> Published-release API

```text
CLI -> API
  - API key
  - project or release request

API -> CLI
  - published release
  - release signature
  - key identifier
```

- Main threats
  - stolen API keys
  - unpublished-release access
  - release tampering
  - replay or stale-release issues
  - secret leakage
  - denial of service through large releases
- Failure behavior
  - Reject missing, invalid, expired, revoked, or incorrectly scoped API keys.
  - Stop when HTTPS is required but unavailable.
  - Stop when the API returns an unauthorized, invalid, incomplete, or oversized release.
  - Stop generation when signature verification fails.
  - Do not write a release or generated files after a failed verification.
  - Display safe errors without printing API keys or authorization headers.
  - Handle timeouts and network failures without exposing response contents or secrets.

### CLI -> Local repository

```text
CLI
  -> validated generated files
  -> consumer repository
```

- Main threats
  - path traversal
  - arbitrary file overwrite
  - shell execution
  - malicious generated content
  - secret leakage
  - partial or inconsistent generation
- Failure behavior
  - Reject invalid, absolute, traversal, or unsafe output paths.
  - Stop before writing files if any path fails validation.
  - Do not execute commands or interpret release data as shell input.
  - Avoid leaving partially generated output after a failed generation.
  - Report file permission, disk, and repository errors without exposing secrets.
  - Require explicit confirmation or a safe policy before overwriting existing files.

## Initial mitigations

- Authentication:
  - Use email/password login with Argon2id or bcrypt hashes.
  - Use opaque, database-backed sessions.
  - Set `HttpOnly`, `Secure`, and `SameSite` cookie attributes.

- Authorization:
  - Check project membership and role on every protected operation.
  - Restrict publishing to publishers and administrators.
  - Restrict API-key management to project administrators.

- Input and web security:
  - Validate request bodies on the server.
  - Use parameterized SQL.
  - Apply CSRF protection to cookie-based mutations.
  - Add security headers and generic production errors.

- API keys and releases:
  - Store only API-key hashes.
  - Support scopes, expiration, revocation, and rotation.
  - Sign published releases with Ed25519.
  - Verify signatures before CLI generation.

- File generation:
  - Require an approved local output root.
  - Reject absolute paths, `..` segments, unsafe separators, and shell execution.
  - Prevent secrets from entering generated files.

- Database and operations:
  - Keep PostgreSQL private.
  - Use a least-privilege runtime account.
  - Use transactions for multi-step updates.
  - Redact credentials and authorization headers from logs.
  - Apply request and rate limits.

## Planned security tests

### Authentication and authorization

- Invalid login does not create a session.
- Expired, deleted, or invalid sessions are rejected.
- Unauthenticated protected requests return `401`.
- Users cannot access another project.
- Editors cannot publish releases or manage API keys.
- Publishers can publish releases but cannot manage API keys.
- Project administrators can create and revoke API keys.
- API-key secrets are displayed only once and are not stored in plaintext.
- API-key hashes, not API-key secrets, are stored by the server.

### Web request and browser security

- Invalid request bodies are rejected.
- Unknown fields, invalid identifiers, and oversized collections are rejected.
- Oversized request bodies are rejected.
- Invalid CSRF tokens are rejected for cookie-based mutations.
- Requests without required CSRF protection are rejected.
- Security headers are present on web responses.
- User-controlled token, component, and template content cannot execute as unintended browser script.
- Login and other sensitive endpoints enforce rate limits.
- Production errors do not expose stack traces, SQL, credentials, or internal paths.

### Database and transaction security

- SQL injection payloads do not alter query behavior.
- Unauthorized project access is rejected before protected data is returned or modified.
- Cross-project token references are rejected.
- Self-referencing tokens are rejected.
- Duplicate token references are rejected.
- Invalid token-type parents are rejected.
- Cyclic token-type hierarchies are rejected.
- Invalid reference modes are rejected.
- Foreign-key and uniqueness violations are handled safely.
- A failed multi-step update rolls back all changes.
- A database outage returns a safe server error.
- Database errors do not expose SQL statements, credentials, schema details, or stack traces.
- Credentials, authorization headers, and sensitive payloads do not appear in logs.

### Published-release API and release signing

- Missing API keys are rejected.
- Invalid API keys are rejected.
- Expired API keys are rejected.
- Revoked API keys are rejected.
- Wrong-project API keys are rejected.
- Wrong-scope API keys are rejected.
- Unpublished or draft releases cannot be downloaded.
- Unauthorized release requests do not reveal whether private releases exist.
- A release from another project cannot be returned.
- Incomplete or invalid release data is not signed or returned.
- Release data is assembled consistently from one valid database state.
- Sensitive database fields, API-key hashes, passwords, and private signing keys do not appear in release responses.
- Modified release content fails signature verification.
- Invalid release signatures stop CLI processing.
- Unknown or untrusted signing-key identifiers are rejected.
- Oversized releases are rejected safely.
- API rate and response-size limits are enforced.
- Network timeouts fail without exposing secrets.
- API keys and authorization headers do not appear in logs.

### CLI and local repository security

- The CLI requires HTTPS outside local development.
- Absolute output paths are rejected.
- `..` traversal paths are rejected.
- Unsafe path separators are rejected.
- Output paths cannot escape the approved local output root.
- Release data cannot cause shell commands to execute.
- Invalid release data stops generation before files are written.
- A failed generation does not leave partial output.
- Existing files are not overwritten unexpectedly.
- File permission and disk errors produce safe failures.
- Generated files contain no passwords, API keys, database credentials, or signing keys.
- Generation succeeds under different local output roots.
- Valid generated output is deterministic.
