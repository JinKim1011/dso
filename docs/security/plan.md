## Security Implementation Plan

DSO is a web workbench backed by PostgreSQL. The workbench edits and publishes design-system resources. An authenticated CLI downloads published releases through the API and generates files locally.

This plan implements the security work alongside [relational-databases.md](../database/relational-databases.md).

## Scope

Implement these controls in the application:

- Workbench login with server-side sessions
- Project and role-based authorization
- CLI API keys with scopes, expiration, and revocation
- Server-side request validation
- Parameterized SQL
- Transaction rollback
- HTTPS/TLS for deployed web and CLI traffic
- CSRF protection for cookie-based mutations
- Security headers and safe error responses
- Safe CLI output paths
- Ed25519 signatures for published releases
- Secret redaction, dependency scanning, and security tests

Document but do not build:

- OAuth 2.0, OpenID Connect, SSO, and MFA
- Full multi-tenant identity management
- Cloud-scale infrastructure and automated certificate management
- HSMs, general PKI, and encryption-at-rest infrastructure
- Provider-managed physical security

## Fixed Architecture Decisions

- The web workbench uses email/password login and server-side sessions.
- Passwords use Argon2id or bcrypt hashes and are never stored in plaintext.
- Sessions use opaque, database-backed cookies with `HttpOnly`, `Secure` in deployment, and `SameSite` protection.
- The CLI uses project-scoped API keys, not web sessions.
- API keys are shown once and have the wire format `dso_<keyIdentifier>_<secret>`. Only the secret hash is stored by the server.
- The CLI reads the complete API key from `DSO_API_KEY`, not from a command-line argument. Administrators rotate keys by creating a replacement and explicitly revoking the previous key.
- All PostgreSQL access goes through `packages/db` and parameterized SQL.
- The CLI communicates with the API only. It never connects directly to PostgreSQL.
- Published releases are signed with Ed25519 and verified by the CLI before generation.
- Release public keys are distributed through a local CLI trust file, not accepted from the release response. The trust file may contain multiple key IDs during signing-key rotation. Signature failure always stops the workflow.
- PostgreSQL is private; only the web/API service is exposed.
- The first version generation is limited to `tokens.json` and `tokens.css`. Components and document templates remain part of the stored and downloaded snapshot for compatibility, but doesn't render Markdown from them.
- Generation is all-or-nothing for its two owned artifacts. Existing output is preserved unless the user confirms an interactive prompt or passes `--force`. Non-interactive conflicts fail with `--force` guidance. Unrelated files are preserved.

## Weekly Plan

### W1: Security Design and Threat Model

Align with W1 in `relational-databases.md`.

#### Build

- Create a data-flow diagram for:
  - Browser -> Workbench API
  - Workbench API -> PostgreSQL
  - CLI -> Published-release API
  - CLI -> Local repository
- Create `docs/security/threat-model.md`.
- List assets:
  - Unpublished resources
  - Published releases
  - Passwords and sessions
  - CLI API keys
  - Database credentials
  - Generated files
- List actors:
  - Editor
  - Publisher
  - Project administrator
  - CLI user
  - Database administrator
  - Attacker
- Record threats, mitigations, and tests for:
  - Broken access control
  - SQL injection
  - Stolen API keys
  - Malformed input
  - CSRF
  - XSS
  - Path traversal
  - Unpublished-release access
  - Secret leakage
  - Denial of service
- Record the security layers used in this project:
  - Physical
  - Network
  - Transport
  - Application
  - Database/data
  - Development/operations

#### Done When

Every important asset and entry point has a threat, mitigation, and planned test.

#### Token relationship scope

DSO does not ingest application source code or claim to know which tokens are used by components.

The protected token relationships are:

- token-type parent-child relationships
- token-to-token references

Component-token usage discovery is excluded from the first release.

### W2: Security Schema and Migrations

Align with W2 in `relational-databases.md`.

#### Build

- Add migrations for:
  - `users(id, email, password_hash, created_at)`
  - `sessions(id, user_id, expires_at, created_at)`
  - `project_members(project_id, user_id, role, created_at)`
  - `api_keys(id, project_id, key_identifier, key_hash, scope, expires_at, revoked_at, created_at)`
  - `audit_events(id, user_id, project_id, action, resource_type, resource_id, created_at)`
- Infer project ownership and release-publishing permissions from `project_members`; do not add `projects.owner_id` or `releases.published_by`in W2.
- Record the user who performs a publish action in `audit_events`.
- Allow `audit_events.project_id` and `audit_events.resource_id` to be null for account-level login events. Require them for project-scoped events through the audit-event constraint and application validation.
- Add foreign keys for users, projects, and API keys.
- Add constraints for:
  - Unique user email
  - Unique project membership
  - Valid member roles
  - Valid API-key scopes
  - Unique API-key identifiers
  - Valid release states
- Add audit-event checks for:
  - `login.succeeded` account events without a project or resource
  - `release.published` events with a release project and resource
  - API-key creation and revocation events with a project and API-key resource
- Add indexes for:
  - Session expiry
  - API-key identifier
  - Project membership
  - Project/release lookup
- Defer runtime-role provisioning to database/deployment administration; use separate migration and runtime credentials when the data-access and deployment layers are implemented.
- Keep passwords, API-key secrets, and signing keys out of migrations and seed data.

#### Tests

- Apply all migrations to an empty database.
- Verify foreign-key failures.
- Verify uniqueness failures.
- Verify invalid roles, scopes, and release states fail.
- Verify valid account-level and project-scoped audit events.
- Verify invalid audit-event scopes fail.

#### Done When

The security schema can be created from an empty PostgreSQL database, and its structural constraints and indexes have been verified. Runtime-role provisioning is tracked under W7.

### W3: Seed data, contracts, authentication, and database access

This week establishes the foundation for every later integration.

#### Build

- Treat design-tokens-manifest.json as a legacy workbench compatibility input, not as the canonical database seed format.
- Define and seed current domain records directly for users, projects, project memberships, token types, tokens, token references, components, document templates, and releases.
- If legacy manifest data is reused during development, pass it through an explicit adapter that accepts only primitive and semantic kinds. Reject class-union, unknown, and other unsupported kinds before domain conversion.
- Add shared schemas and types to `packages/contracts` for login, resource writes, hierarchy changes, publishing, API keys, and release downloads.
- Validate required fields, enum values, identifiers, unknown fields, token references, token-type relationships, and collection sizes.
- Reject self-references, duplicate references, cross-project references, invalid parents, and cyclic token-type hierarchies.
- Implement password hashing, database-backed sessions, expiration, logout, opaque cookies, and the environment configuration needed by the web/API.
- Implement `packages/db` with a pool, parameterized repositories, transaction helpers, membership authorization, API-key verification, and audit-event insertion.
- Require authorization context for protected repository functions and keep credentials, authorization headers, and sensitive payloads out of logs.
- W3 implements password authentication, database-backed workbench sessions, session expiration, logout, and session-based application authorization. API-key-authenticated release downloads remain deferred to W5.
- Keep the legacy manifest adapter tolerant for existing workbench compatibility, but apply strict validation at the domain and persistence boundaries. Database seed data must contain only supported token kinds and must not contain real passwords, API-key secrets, signing keys, or other credentials.

#### Tests

- Valid login creates a session; invalid login and expired sessions fail.
- Invalid and oversized requests are rejected before repository calls.
- Parameterized SQL resists injection payloads.
- Unauthorized projects, invalid relationships, foreign keys, uniqueness constraints, and transaction rollback behave correctly.
- Seed data contains no real secrets.

#### Done When

Authenticated and authorized repository operations work against PostgreSQL and all application database access goes through tested repositories.

### W4: Workbench integration and web security

This week replaces the legacy manifest persistence path with PostgreSQL while preserving staged editing.

#### Build

Delivered:

- Workbench data comes from PostgreSQL through authenticated, project-scoped loading. The legacy manifest is no longer read or written.
- Staged token/reference saving and release publication are one atomic operation (`POST /api/releases/publish`): session, CSRF policy, publisher role, project lock, final-state validation, and audit events in one transaction. There is no standalone save endpoint.
- Login, logout, and session routes use the configured session cookie and map sessions to the application authorization context. Pages redirect unauthenticated users; APIs return `401`.
- Roles: editor reads project resources and edits client-side drafts; publisher adds saving and publishing; admin adds API-key management (service level). Cross-project access is rejected by membership checks.
- The [CSRF policy](./threat-model.md#csrf-policy) applies to login, logout, and publishing. Security headers are set and the CSP is report-only.
- Production errors are generic and include a correlation ID for unexpected failures.
- Audit events: login success/failure, logout, token batch saves, release publication, API-key creation, and revocation.
- Development login uses seeded role accounts whose password hashes come from `DSO_SEED_USER_PASSWORD`; no password is committed.

Deferred:

- Production enablement: login, logout, and publishing work only in development.
- W6: rate limiting, CSP enforcement, and CSP violation reporting.
- W5 Day 3: token generation and the `dso generate` command. Published-release reads, API-key create/revoke routes, release signing, `dso pull`, trust-file verification, and atomic verified caching are implemented.
- After W5: workbench persistence for token-type hierarchy, components, and templates, including React Flow updates.
- Request-ID duplicate-publish protection (see below).
- Editor-only saving without publishing.

#### Known issue: Lost publication responses

If publication commits but the response is lost, the workbench cannot determine whether that specific request succeeded. The draft is preserved and the UI does not automatically retry. Check the release and audit records before retrying; the workbench does not yet provide a release-history view. These records may help an investigation but cannot always link a release to the specific request.

The staged `before` checks reject many stale retries but do not guarantee deduplication if project data later returns to its earlier state. A future improvement can use a stable request ID recorded atomically with publication and preserved by the client across retries.

#### Tests

- Covered by existing tests (not re-run during this review): unauthenticated `401`, insufficient roles, CSRF rejection, audit events, atomic rollback, and staged editing.
- Not asserted: security-header presence, cross-project access on every route, and rate limits.
- PostgreSQL is the source of truth and the manifest file is unused.

#### Done When

An authenticated user can edit only authorized projects, role restrictions are enforced, and a publisher can publish through the workbench in development. Production enablement and the deferred items remain open.

### W5: Signed token release, CLI, and generation

This week delivers the publish-to-token-artifact vertical slice. Component registration and document-template generation remain outside W5. Their stored snapshot data is retained, but the CLI does not interpret or generate from it.

#### Build

The three implementation days are ordered to avoid coupling downstream work to unfinished server contracts.

##### Day 1: Release and API-key boundary

- Add session and API-key authentication to `GET /api/releases/:releaseId`.
- Accept CLI credentials in the `Authorization: Bearer` header as `dso_<keyIdentifier>_<secret>`.
- Parse the identifier for lookup, hash and verify the secret, then verify the key's project, `release:read` scope, expiration, revocation, and release publication status.
- Add admin-only, CSRF-protected, audited API-key create/revoke routes. Return the combined API-key string only during creation.

##### Day 2: Signing and download

- The shared release-protocol package canonicalizes, signs, parses, and verifies Ed25519 release envelopes.
- The complete published-release payload is canonicalized with the `signature` object excluded and signed at the HTTP response boundary.
- `apps/cli` provides `dso pull`. The CLI reads `DSO_API_KEY`, requires HTTPS outside local loopback development, and has no PostgreSQL dependency.
- Trusted public keys are loaded by key ID from the local trust file. The trust file may contain multiple key IDs and the release response never supplies a trusted public key.
- Invalid schema, response, key ID, or signature data stops before cache changes. Verified envelopes are written through a temporary file and atomic rename.

##### Day 3: Token generation and verification

- `@repo/generator` and `dso generate` are implemented as a pure generator plus offline CLI orchestration.
- Generate only `tokens.json` and `tokens.css` from token types, tokens, and references in the validated signed snapshot.
- Cache is bounded-read, parsed, signature-verified, and release-ID checked again for every generate operation.
- CSS variable names are derived by the generator. The release's legacy `cssVar` field is ignored.
- Make output deterministic and independent of the local output root.
- Prompt before replacing existing `tokens.json` or `tokens.css` in an interactive terminal. `--force` replaces only those owned artifacts without prompting.
- In non-interactive execution, reject a conflict unless `--force` is present.
- Stage both generated files, back up existing owned files, install both names, and roll back on command failure. Preserve unrelated files.
- Keep component and document-template generation, placeholder rendering, and release-driven `documentPath` handling out of W5.

#### Tests

- Invalid, expired, revoked, wrong-scope, and wrong-project keys fail.
- Invalid signatures, modified payloads, and unknown key IDs stop pull or generation without changing cache or output.
- Valid releases work under different local output roots and produce identical token artifacts.
- Interactive conflicts require confirmation; non-interactive conflicts fail unless `--force` is present.
- `--force` replaces only `tokens.json` and `tokens.css`; unrelated files remain.
- A generation failure leaves both existing outputs unchanged.
- API keys and signing secrets do not appear in logs or generated files.
- The CLI uses only the API and has no PostgreSQL dependency.
- `dso pull` integration coverage verifies a signed HTTP response, trust lookup, cache creation, and preservation of existing cache bytes after tampering.

#### Done When

This workflow succeeds:

```text
Workbench publish -> signed release API -> dso pull
-> signature verification -> dso generate
-> deterministic tokens.json and tokens.css
```

The documented failure policy is verified: invalid credentials or signatures make no output changes; conflicting outputs require confirmation or `--force`; both token artifacts are committed together or not at all.

#### Not in W5

- Component Markdown generation and template placeholder rendering.
- Workbench editing for components, templates, or token-type hierarchy.
- Automatic component-token discovery or source-code scanning.
- API-key management UI, managed signing-key infrastructure, HSMs, or automatic key rotation. Operators distribute public trust files and keep private signing keys in deployment configuration.
- Rate limiting, CSP enforcement, production enablement, and final deployment evidence; these remain W6 work.

### W6: Performance, deployment security, documentation, and final verification

This week completes evidence, hardening, and the clean end-to-end run.

#### Build and evidence

- Run `EXPLAIN ANALYZE` on representative release, token-type, token-reference, reverse-reference, hierarchy, and complete-release queries.
- Document connection pooling, caching, read replicas, API statelessness, larger releases, migration management, scaling limits, and raw SQL versus ORM/data-mapper choices.
- Document HTTPS, private PostgreSQL networking, separate migration/runtime credentials, least privilege, request/rate limits, dependency scanning, secret scanning, log redaction, key rotation, backups, and incident limits.
- Complete the authentication, authorization, input-validation, TLS, signing, key-management, web-threat, and secure-SDLC evidence.
- Complete setup, CLI, use-case, threat-model, and implemented/open/excluded risk documentation.
- Run from an empty database: migrations, seed, login, editing, publishing, API-key creation, CLI pull, signature verification, token generation, output inspection, tests, typecheck, lint, security scans, and smoke checks.

#### Required final security tests

- Unpublished releases cannot be downloaded.
- SQL injection, CSRF, path traversal, cross-project access, self-references, duplicate references, invalid parents, cyclic hierarchies, and failed transactions are rejected or rolled back.
- Logs and generated files contain no secrets.
- Signed releases preserve token references and hierarchy data.

#### Done When

Performance measurements, deployment/security evidence, documentation, and the complete empty-database workflow are ready for the report and demonstration.

### Level 1 Requirement Mapping

- Cybersecurity dimensions: W1 and W6
- Threat model analysis: W1
- Physical, network, transport, application, and data threats: W1, W4, and W6
- Authentication and authorization: W3 and W4
- Validation: W3 and W4
- Encryption and TLS: W5 and W6
- Digital signing: W5
- Key management: W2 and W5
- Web application security: W4
- Secure development and operation: W6
- Documentation and oral presentation: W6

### Oral Examination Preparation

Prepare a five-minute walkthrough covering:

1. DSO trust boundaries and assets.
2. The highest-risk threats from the threat model.
3. Web session authentication and project authorization.
4. CLI API-key creation, hashing, scope, and revocation.
5. TLS, symmetric encryption, and asymmetric cryptography.
6. Input validation, CSRF, and SQL injection mitigation.
7. Token-reference and token-type hierarchy integrity.
8. Release signing and CLI verification.
9. Remaining risks and excluded features.

Be able to explain the CIA triad plus authenticity and non-repudiation, OAuth
2.0 and OpenID Connect conceptually, and why those protocols are not
implemented in this project.
