## Security Implementation Plan

DSO is a web workbench backed by PostgreSQL. The workbench edits and publishes design-system resources. An authenticated CLI downloads published releases through the API and generates files locally.

This plan implements the security work alongside `implementation-plans/relational-databases.md`.

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
- API keys are shown once, stored only as hashes, and can be revoked or rotated.
- All PostgreSQL access goes through `packages/db` and parameterized SQL.
- The CLI communicates with the API only. It never connects directly to PostgreSQL.
- Published releases are signed with Ed25519 and verified by the CLI before generation.
- PostgreSQL is private; only the web/API service is exposed.
- Published component document paths are portable relative paths. The CLI or
  consuming repository supplies the local output root.

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
- Add shared schemas and types to `packages/contracts` for login, resource
  writes, hierarchy changes, publishing, API keys, and release downloads.
- Validate required fields, enum values, identifiers, unknown fields, token
  references, token-type relationships, and collection sizes.
- Reject self-references, duplicate references, cross-project references,
  invalid parents, and cyclic token-type hierarchies.
- Implement password hashing, database-backed sessions, expiration, logout,
  opaque cookies, and the environment configuration needed by the web/API.
- Implement `packages/db` with a pool, parameterized repositories,
  transaction helpers, membership authorization, API-key verification, and
  audit-event insertion.
- Require authorization context for protected repository functions and keep
  credentials, authorization headers, and sensitive payloads out of logs.

#### Tests

- Valid login creates a session; invalid login and expired sessions fail.
- Invalid and oversized requests are rejected before repository calls.
- Parameterized SQL resists injection payloads.
- Unauthorized projects, invalid relationships, foreign keys, uniqueness
  constraints, and transaction rollback behave correctly.
- Seed data contains no real secrets.

#### Done When

Authenticated and authorized repository operations work against PostgreSQL and
all application database access goes through tested repositories.

### W4: Workbench integration and web security

This week replaces the current persistence path while preserving staged editing.

#### Build

- Replace filesystem persistence with database repositories.
- Preserve `StagedManifestContext` and `useStagedManifestActions`.
- Protect project reads, token/reference/hierarchy writes, component/template
  writes, publishing, API-key creation/revocation, and release reads.
- Enforce:
  - Editor: read and edit project resources
  - Publisher: editor permissions plus release publishing
  - Admin: publisher permissions plus API-key management
  - CLI `release:read`: published-release download only
- Add CSRF protection to cookie-based mutations and add security headers.
- Return generic production errors without stacks or secrets.
- Create audit events for login, publishing, API-key creation, and revocation.

#### Tests

- Unauthenticated requests return `401`.
- Cross-project access and insufficient roles fail.
- CSRF-protected mutations reject invalid requests.
- Security headers and audit events are present.
- Staged editing remains functional and PostgreSQL is the source of truth.

#### Done When

An authenticated user can edit only authorized projects, role restrictions are
enforced, and a user can publish through the workbench.

### W5: Release signing, CLI, and generation

This week delivers the complete publish-to-generation vertical slice.

#### Build

- Create a published-release API containing token definitions, references,
  token-type hierarchy data, components, and templates.
- Keep source-code component-token usage claims out of release data.
- Canonicalize release JSON and sign it with Ed25519.
- Create `apps/cli` with `dso pull` and `dso generate`.
- Return API-key secrets only once and store only hashes.
- Validate API-key identifier, hash, project, scope, expiration, and revocation.
- Require HTTPS outside local development; the CLI must never connect to
  PostgreSQL.
- Verify signatures before generation and stop on failure.
- Generate `tokens.json`, `tokens.css`, and component Markdown.
- Resolve portable document paths below a configured output root and reject
  absolute paths, `..` traversal, unsafe separators, and shell execution.
- Make generated output deterministic and keep credentials out of output.

#### Tests

- Invalid, expired, revoked, wrong-scope, and wrong-project keys fail.
- Invalid signatures stop generation.
- Valid releases work under different local output roots.
- Unsafe paths fail, output is deterministic, and the CLI uses only the API.

#### Done When

This workflow succeeds:

```text
Workbench publish -> signed release API -> dso pull
-> signature verification -> dso generate
```

### W6: Performance, deployment security, documentation, and final verification

This week completes evidence, hardening, and the clean end-to-end run.

#### Build and evidence

- Run `EXPLAIN ANALYZE` on representative release, token-type,
  token-reference, reverse-reference, hierarchy, and complete-release queries.
- Document connection pooling, caching, read replicas, API statelessness,
  larger releases, migration management, scaling limits, and raw SQL versus
  ORM/data-mapper choices.
- Document HTTPS, private PostgreSQL networking, separate migration/runtime
  credentials, least privilege, request/rate limits, dependency scanning,
  secret scanning, log redaction, key rotation, backups, and incident limits.
- Complete the authentication, authorization, input-validation, TLS,
  signing, key-management, web-threat, and secure-SDLC evidence.
- Complete setup, CLI, use-case, threat-model, and implemented/open/excluded
  risk documentation.
- Run from an empty database: migrations, seed, login, editing, publishing,
  API-key creation, CLI pull, signature verification, generation, output
  inspection, tests, typecheck, lint, security scans, and smoke checks.

#### Required final security tests

- Unpublished releases cannot be downloaded.
- SQL injection, CSRF, path traversal, cross-project access, self-references,
  duplicate references, invalid parents, cyclic hierarchies, and failed
  transactions are rejected or rolled back.
- Logs and generated files contain no secrets.
- Signed releases preserve token references and hierarchy data.

#### Done When

Performance measurements, deployment/security evidence, documentation, and the
complete empty-database workflow are ready for the report and demonstration.

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
