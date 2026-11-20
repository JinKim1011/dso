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
    - preventing unsafe writes to its owned token artifacts
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
- CLI signing-key trust file: need to keep key trust independent of the release API
- Local output path used by generation: need to protect path traversal
- Database connection: need to protect the database and enforce data integrity

## Trust boundaries

The receiving side should not automatically trust data.

- Browser -> Workbench API : API validates browser input before saving it.
- Workbench API -> PostgreSQL : use parameterized queries and constraints.
- Published-release API -> CLI : verifies release signatures before generation.
- CLI -> Local repository : validates fixed output paths, verifies signatures, and applies all-or-nothing replacement.

## Data flows

### Browser -> Workbench API

- Staged token save and release publication are one operation. It requires a
  session and the publisher role. There is no standalone save endpoint.

```text
Browser
  -> HTTPS request in deployment
     - session cookie for authenticated requests
     - CSRF headers for mutations
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
  - log unexpected API errors with a correlation ID and include it in the response
  - do not persist partial changes

#### CSRF policy

Apply the shared check to every workbench mutation, including login:

- Set `DSO_WORKBENCH_ORIGIN` to the public origin without a path. Require
  `Origin` to match it exactly; reject missing or `null` origins. Do not derive
  the trusted origin from request headers.
- Require `X-DSO-CSRF: 1`. It is not a secret or token. Do not allow untrusted
  origins to send it through CORS.
- Require `Sec-Fetch-Site: same-origin` when the header is present. If absent,
  require the Origin and custom-header checks.
- Return a generic 403 for rejected requests. Invalid or missing origin
  configuration fails closed with a server error.

Session and role checks remain separate. SameSite cookies add protection. This
policy does not prevent XSS or authenticate clients that can forge headers.
Use HTTPS in deployment.

#### Security headers

Workbench responses use these browser protections:

- `X-Content-Type-Options: nosniff` prevents MIME type guessing.
- `X-Frame-Options: DENY` prevents embedding and clickjacking.
- `Referrer-Policy: strict-origin-when-cross-origin` limits referrer disclosure.
- `Strict-Transport-Security` requires HTTPS after a secure connection.
- `Permissions-Policy` disables camera, microphone, and geolocation access.
- Content Security Policy restricts resource loading and script execution.

#### Audit trail

Record important actions and failed logins. Restrict access to audit records
and exclude credentials, session IDs, token names, and token values. See the
[audit event catalogue](../database/er-model.md#audit-event-catalogue).

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
  - combined API key from DSO_API_KEY
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
  - replacing trusted signing keys through the same compromised channel as the release
- Failure behavior
  - Reject missing, invalid, expired, revoked, or incorrectly scoped API keys.
  - Stop when HTTPS is required but unavailable.
  - Stop when the API returns an unauthorized, invalid, incomplete, or oversized release.
  - Stop `dso pull` when signature verification fails, and stop generation when
    it consumes a rejected release.
  - Reject redirects, malformed JSON, invalid UTF-8, wrong content type, and
    stream bodies above the release-response limit.
  - Do not update cache or generated files after a failed verification.
  - Display safe errors without printing API keys or authorization headers.
  - Handle timeouts and network failures without exposing response contents or secrets.

The API-key string is `dso_<keyIdentifier>_<secret>`. The CLI reads the complete value from `DSO_API_KEY` and does not accept it as a command-line argument.

The server looks up `keyIdentifier` and verifies a hash of `secret`; it never stores the combined value or plaintext secret. Operators rotate keys by issuing a replacement and explicitly revoking the previous key.

The CLI trust file is independent of the release API. It maps trusted signing
key IDs to Ed25519 public keys and may temporarily contain both old and new
keys during rotation. The server response cannot establish trust in its own
key.

The Workbench operator controls the private signing key and injects it through
`DSO_RELEASE_SIGNING_PRIVATE_KEY` plus `DSO_RELEASE_SIGNING_KEY_ID`. CLI
administrators independently distribute the corresponding public key and key
ID through the trust file. For rotation, publish the new public key, retain
both IDs in the trust file, switch Workbench signing to the new private key,
then retire the old ID after the overlap period. Neither side should distribute
a private signing key to the CLI.

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
  - Only permits the fixed owned artifact names `tokens.json` and `tokens.css` under the configured output root.
  - Stop before writing files if any path fails validation.
  - Do not execute commands or interpret release data as shell input.
  - Stage both files and commit them together; do not leave partial output.
  - Report file permission, disk, and repository errors without exposing secrets.
  - In an interactive run, confirm before overwriting either owned artifact.
    `--force` replaces only those artifacts without prompting.
  - In a non-interactive run, fail on conflicts unless `--force` is present.
  - Preserve all unrelated files in the output directory.

Component document paths remain stored release data, but the first release version does not use them to choose local output files. Component Markdown and template rendering are therefore outside this threat boundary.

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
  - Show a combined `dso_<keyIdentifier>_<secret>` API key once and store only a
    hash of the secret.
  - Support project scope, expiration, revocation, and create-then-revoke rotation.
  - Sign published releases with Ed25519.
  - Verify signatures before CLI generation.
  - Load trusted public keys from a local trust file with multiple key IDs.

- File generation:
  - Generate only fixed `tokens.json` and `tokens.css` paths below an approved output root.
  - Preserve unrelated files, confirm interactive overwrite, and require `--force` for non-interactive replacement.
  - Replace both generated artifacts atomically.
  - Prevent secrets from entering generated files.

- Database and operations:
  - Keep PostgreSQL private.
  - Use a least-privilege runtime account.
  - Use transactions for multi-step updates.
  - Redact credentials and authorization headers from logs.
  - Apply request and rate limits.

## Security layers

DSO uses defense in depth. Each layer provides independent protection so that the failure of one control does not automatically expose the entire system.

### Physical security

DSO does not implement provider-managed physical security.

### Network security

Network security controls which systems can communicate with each other. A
network compromise must not by itself bypass application authentication and
project authorization.

- PostgreSQL remains on a private network.
- Only the Workbench/API service can connect to PostgreSQL.
- PostgreSQL is not exposed directly to the public internet.
- Firewall or security-group rules restrict database access.
- The CLI communicates with the API and never connects directly to PostgreSQL.
- API and database access should be separated by environment where practical.

### Transport security

Protects data while it moves between systems. Transport encryption protects credentials and data in transit but does not replace authentication or authorization.

- Browser-to-API traffic uses HTTPS/TLS.
- CLI-to-API traffic uses HTTPS/TLS outside local development.
- The CLI rejects non-HTTPS API URLs outside local development.
- Sessions, API keys, release data, and signatures are not sent over plain HTTP.
- TLS configuration and certificate handling are deployment responsibilities.

### Application security

Protects the behavior and interfaces of Workbench, API, CLI, and generator.

- Email/password authentication with hashed passwords.
- opaque, database-backed sessions.
- Project membership and role-based authorization.
- Scoped, expiring, revocable CLI API keys.
- Server-side request validation and size limits.
- Parameterized SQL through the data-access layer.
- CSRF protection for cookie-based mutations.
- Security headers and generic production errors.
- Release-signature verification before CLI generation.
- Fixed output-path validation and all-or-nothing artifact replacement.
- No shell execution based on release data.

### Database and data security

Protects stored information, data integrity, and relationships between entities.

- Least-privilege database credentials.
- Private PostgreSQL access.
- Parameterized queries.
- Foreign key, check, unique, and not-null constraints.
- Project-isolation checks before protected reads and writes.
- Transaction rollback for failed multi-step updates.
- Validation of token-type hierarchies and token references.
- Passwords and API-key secrets are never stored in plaintext.
- Database errors do not expose credentials, SQL, schema details, or stack traces.
- Logs do not contain passwords, API keys, authorization headers, or signing keys.
- Published release data is validated before it is signed and returned.

### Development and operations security

Protects the system throughout its lifecycle, including development, deployment, monitoring, maintenance, and incident response. Some development and operational controls are planned rather than implemented in the application. Their implementation status must be verified separately during deployment and final security testing.

- Typecheck, lint, unit, integration, and security tests.
- Dependency vulnerability scanning.
- Secret scanning before changes are merged.
- Keeping credentials and signing keys out of source control.
- Injecting secrets through deployment configuration.
- Session expiration and credential rotation.
- API-key create-then-revoke rotation and multi-key signing-key overlap
  procedures.
- Request, login, mutation, and release-download rate limits.
- Redacted logs and operational error review.
- Database backups and restore procedures.
- Migration verification and deployment checks.
- Documented incident-response limitations and recovery procedures.

## Security-layer verification evidence

The following are planned tests and verification activities for the security
layers described above. They are evidence requirements, not claims that every
control has already been implemented or verified. Automated tests cover
application behavior and data integrity. Deployment and operational controls
require configuration inspection, environment checks, or documented provider
evidence.

Verification status:

- **Planned:** defined here but not yet executed or recorded.
- **Completed:** execution evidence has been recorded in this document or a
  linked verification record.
- **Provider responsibility:** supplied by the hosting or infrastructure
  provider and documented as an assumption.

### Physical security verification

Physical security is provided by the hosting or infrastructure provider and is
not implemented by DSO application code. Verification evidence:

- **Provider responsibility:** Confirm that facility access, hardware,
  database storage, and backups are protected by the hosting provider.
- **Planned:** Document responsibility for hardware disposal and unauthorized
  console access.
- **Planned:** Confirm that production credentials, API keys, and signing keys
  are not stored in repository files or local seed data.

### Network security verification

- **Planned:** Confirm that PostgreSQL is bound to a private network or
  internal interface.
- **Planned:** Confirm that PostgreSQL is not reachable from the public
  internet.
- **Planned:** Confirm that only the Workbench/API service can connect to
  PostgreSQL.
- **Planned:** Confirm that firewall or security-group rules deny unauthorized
  database connections.
- **Completed in code:** The CLI uses the Published-release API and has no
  PostgreSQL connection configuration or database dependency.
- **Planned:** Confirm that development, migration, and production database
  access are separated where required.
- **Planned:** Verify that a network-level connection attempt from an
  unauthorized host is rejected.

### Transport security verification

- **Planned:** Confirm that browser-to-API traffic uses HTTPS in deployed
  environments.
- **Completed in code:** CLI-to-API traffic requires HTTPS outside local
  development.
- **Completed in code:** The CLI rejects non-HTTPS API URLs outside local
  development.
- **Planned:** Confirm that sessions, API keys, release data, and signatures
  are never sent over plain HTTP.
- **Planned:** Verify that deployed TLS certificates are valid and not expired.
- **Completed in code:** The CLI explicitly rejects HTTP redirects rather
  than forwarding Authorization data to another endpoint.
- **Planned:** Confirm that authorization headers and session cookies are
  protected by the configured transport security.

### Application and database security verification

The application and database checks are specified in the dedicated planned
security-test sections below. Those tests provide evidence for:

- Authentication, authorization, API-key, request-validation, CSRF, XSS, and
  security-header controls.
- Release-signature verification, safe generation, path validation, and secret
  handling.
- SQL-injection resistance, project isolation, data constraints, relationship
  validation, transaction rollback, safe database errors, and log redaction.

**Status:** Migration verification confirms the expected domain and security
tables, constraints, indexes, and migration history. The database integration
suite passes against PostgreSQL 16.15. Application-level authentication,
authorization, and security-header testing remains planned where not covered
by the database suite.

### Development and operations verification

- **Planned:** Typecheck, lint, unit, integration, and security tests run
  successfully.
- **Planned:** Dependency vulnerability scanning runs in CI.
- **Planned:** Secret scanning runs before changes are merged.
- **Planned:** Repository history and seed data contain no production
  credentials, API keys, passwords, or signing keys.
- **Planned:** Deployment configuration injects secrets without committing them
  to source control.
- **Planned:** Session expiration and API-key revocation are verified.
- **Completed in code:** Local trust-file loading and multiple signing-key IDs
  are implemented and tested. Rotation overlap remains an operator procedure.
- **Planned:** Login, mutation, API-key, and release-download rate limits are
  configured and verified.
- **Planned:** Logs are checked to confirm that credentials, authorization
  headers, and sensitive payloads are redacted.
- **Planned:** Database backup and restore procedures are documented and
  tested.
- **Planned:** Migration and deployment checks are recorded as release
  evidence.
- **Planned:** Incident-response limitations and recovery responsibilities are
  documented.

## Resolved cross-document decisions

The following decisions are now fixed by the completed schemas and the W5 plan:

- The published-release response includes an Ed25519 algorithm, signing-key ID,
  and signature. The trust decision uses a local CLI trust file.
- Immutable release contents are stored in `release_snapshots` and associated one-to-one with `releases`.
- The security schema for users, sessions, project membership, API keys, and audit events is represented in the ER model and migrations.
- Token references intentionally require uniqueness on
  `(referencing_token_id, slot)` in addition to the reference identity key.
  A token may reference only one target per slot, while supporting multiple
  slots and therefore multiple references overall.

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
- Mutations reject invalid Origin, custom header, and Fetch Metadata values.
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
- A release cannot replace or modify the CLI trust file.
- Oversized releases are rejected safely.
- API rate and response-size limits are enforced.
- Network timeouts fail without exposing secrets.
- API keys and authorization headers do not appear in logs.
- Verified cache writes use a same-directory temporary file and atomic rename.
- An end-to-end pull test confirms that a tampered response cannot replace
  existing cache bytes.

### CLI and local repository security

- The CLI requires HTTPS outside local development.
- Generated artifact paths are restricted to `tokens.json` and `tokens.css` below the approved local output root.
- Release data cannot cause shell commands to execute.
- Invalid release data stops generation before files are written.
- A failed generation does not leave partial output.
- Interactive generation asks before replacing either owned artifact.
- `--force` replaces only the two owned artifacts.
- Non-interactive conflicts fail unless `--force` is provided.
- Unrelated output-directory files are preserved.
- File permission and disk errors produce safe failures.
- Generated files contain no passwords, API keys, database credentials, or signing keys.
- Generation succeeds under different local output roots.
- Valid generated output is deterministic.
