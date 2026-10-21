# Cybersecurity Implementation Plan

DSO is a web workbench backed by PostgreSQL. The workbench edits and publishes design-system resources. An authenticated CLI downloads published releases through the API and generates files locally.

This plan implements the security work alongside `implementation-plans/relational-databases.md`.

## Security Scope

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

## W1: Security Design and Threat Model

Align with W1 in `relational-databases.md`.

### Build

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

### Done When

Every important asset and entry point has a threat, mitigation, and planned test.

### Token relationship scope

DSO does not ingest application source code or claim to know which tokens are used by components.

The protected token relationships are:

- token-type parent-child relationships
- token-to-token references

Component-token usage discovery is excluded from the first release.

## W2: Security Schema and Migrations

Align with W2 in `relational-databases.md`.

### Build

- Add migrations for:
  - `users(id, email, password_hash, created_at)`
  - `sessions(id, user_id, expires_at, created_at)`
  - `project_members(project_id, user_id, role, created_at)`
  - `api_keys(id, project_id, key_identifier, key_hash, scope, expires_at, revoked_at, created_at)`
  - `audit_events(id, user_id, project_id, action, resource_type, resource_id, created_at)`
- Extend `projects` and `releases` with ownership and publisher relationships.
- Add foreign keys for users, projects, releases, and API keys.
- Add constraints for:
  - Unique user email
  - Unique project membership
  - Valid member roles
  - Valid API-key scopes
  - Unique API-key identifiers
  - Valid release states
- Add indexes for:
  - Session expiry
  - API-key identifier
  - Project membership
  - Project/release lookup
- Create a least-privilege runtime database role.
- Keep passwords, API-key secrets, and signing keys out of migrations and seed data.

### Tests

- Apply all migrations to an empty database.
- Verify foreign-key failures.
- Verify uniqueness failures.
- Verify invalid roles, scopes, and release states fail.

### Done When

The security schema can be created from an empty PostgreSQL database and enforces its core invariants.

## W3: Seed Data, Contracts, and Authentication

Align with W3 in `relational-databases.md`.

### Build

- Add fake users, projects, memberships, components, and releases to `database/seed`.
- Add shared schemas and types to `packages/contracts` for:
  - Login
  - Token and token-reference writes
  - Token-type hierarchy writes
  - Component/template writes
  - Release publishing
  - API-key creation
  - Release downloads
- Validate types, required fields, enum values, identifiers, token references, token-type hierarchy relationships, and unknown fields.
  - Reject self-referencing tokens.
  - Reject duplicate token references.
  - Reject references across projects.
  - Reject token-type parents from another project.
  - Reject cyclic token-type hierarchies.
- Enforce request-body, template, string, and collection-size limits.
- Add web authentication:
  - Login with email and password
  - Verify a password hash
  - Create a database session
  - Set an opaque session cookie
  - Expire and delete sessions
- Add environment configuration for:
  - `DATABASE_URL`
  - `SESSION_SECRET`
  - `DSO_API_BASE_URL`
  - `RELEASE_SIGNING_PRIVATE_KEY`
  - `RELEASE_SIGNING_KEY_ID`

### Tests

- Valid login creates a session.
- Invalid login does not create a session.
- Expired sessions are rejected.
- Invalid and oversized requests are rejected.
- Seed data contains no real secrets.

### Done When

The workbench can authenticate a seeded user, and invalid input cannot reach repository functions.

## W4: Secure Data-Access Layer

Align with W4 in `relational-databases.md`.

### Build

- Implement in `packages/db`:
  - PostgreSQL pool
  - Transaction helper
  - Parameterized repositories
  - Project-membership lookup
  - API-key verification
  - Audit-event insertion
- Implement repositories for:
  - `getPublishedRelease`
  - `listTokensByType`
  - `getReferencedTokens`
  - `getReferencingTokens`
  - `getTokenTypeChildren`
  - `getTokenTypeAncestors`
  - `getTemplateForComponent`
  - `saveStagedTokenChanges`
  - `authorizeProjectMember`
  - `verifyApiKey`
  - `recordAuditEvent`
- Require user/project context in protected repository functions.
- Check authorization before reads and mutations.
- Keep credentials, authorization headers, and sensitive payloads out of logs.

### Tests

- Successful queries
- Empty results
- Parameterized SQL with injection payloads
- Unauthorized project access
- Token-reference joins
- Reverse token-reference queries
- Token-type hierarchy queries
- Unauthorized cross-project token references
- Invalid parent token types
- Self-references
- Duplicate references
- Cyclic token-type hierarchies
- Transaction rollback after a failed update
- Foreign-key and uniqueness failures

### Done When

All application database operations use tested repositories and protected operations require authorization context.

## W5: Workbench API and Web Security

Align with W5 in `relational-databases.md`.

### Build

Implement these routes in `apps/workbench`:

| Method | Route                                 | Auth            | Purpose                                                   |
| ------ | ------------------------------------- | --------------- | --------------------------------------------------------- |
| `POST` | `/api/auth/login`                     | None            | Create a session                                          |
| `POST` | `/api/auth/logout`                    | Session         | Delete a session                                          |
| `GET`  | `/api/auth/session`                   | Session         | Read current user                                         |
| `GET`  | `/api/projects/:projectId`            | Session         | Read authorized project data                              |
| `PUT`  | `/api/projects/:projectId/tokens`     | Editor          | Save tokens, references, and token-type hierarchy changes |
| `PUT`  | `/api/projects/:projectId/components` | Editor          | Save components/templates                                 |
| `POST` | `/api/projects/:projectId/releases`   | Publisher       | Publish a release                                         |
| `POST` | `/api/projects/:projectId/api-keys`   | Admin           | Create an API key                                         |
| `POST` | `/api/api-keys/:keyId/revoke`         | Admin           | Revoke an API key                                         |
| `GET`  | `/api/releases/:releaseId`            | Session/API key | Read a published release                                  |

- Replace filesystem persistence with database repositories.
- Protect every route with authentication and project authorization.
- Use this permission model:
  - Editor: read and edit project resources, including tokens, token references, token-type hierarchy data, components, and templates
  - Publisher: editor permissions plus release publishing
  - Admin: publisher permissions plus API-key management
  - CLI `release:read`: published-release download only
- Add CSRF protection to cookie-based `POST`, `PUT`, and `DELETE` requests.
- Add security headers.
- Return generic production errors without stack traces or secrets.
- Preserve staged editing in `StagedManifestContext`.
- Create audit events for login, publish, API-key creation, and API-key revocation.

### Tests

- Unauthenticated requests return `401`.
- Authenticated users cannot access another project.
- Editors cannot publish or manage API keys.
- Publishers can publish.
- Admins can create and revoke API keys.
- CSRF-protected mutations reject invalid requests.
- Security headers are present.

### Done When

An authenticated user can edit only authorized projects and cannot perform actions outside their role.

## W6: CLI, API Keys, TLS, and Release Signing

Align with W6 in `relational-databases.md`.

### Build

- Create `apps/cli` commands:
  - `dso pull`
  - `dso generate`
- Create the CLI API-key flow:
  1. Admin creates a key.
  2. API returns the secret once.
  3. Server stores only the key hash.
  4. User configures the key outside Git.
  5. CLI sends the key only to the API over HTTPS.
  6. API checks identifier, hash, project, scope, expiration, and revocation.
- Reject invalid, expired, revoked, wrong-scope, and wrong-project keys.
- Require HTTPS outside local development.
- Never print keys, write keys to generated files, or log authorization headers.
- Add release signing:
  1. Canonicalize the published release JSON.
  2. Sign it with Ed25519.
  3. Return release, signature, and key identifier.
  4. Verify the signature in the CLI.
  5. Stop generation when verification fails.
- Include token definitions, token references, token-type hierarchy data, components, and templates in the canonical signed release JSON.
- Do not include claims about tokens used by component source code.
- Implement generation in `packages/generator` for:
  - `tokens.json`
  - `tokens.css`
  - Component Markdown based on registered component metadata and templates
- Accept the local output root from a CLI option or checked-in project
  configuration, with a documented default.
- Resolve each component's portable relative document path inside that approved
  output root.
- Reject absolute paths, `..` traversal, unsafe separators, and shell
  execution based on release data.
- Do not treat release data as component source-file locations or as evidence of
  component-token usage.

### Tests

- CLI uses the API and never PostgreSQL.
- Invalid and revoked keys fail.
- HTTPS is required outside local development.
- Invalid release signatures stop generation.
- Generated output never contains credentials.
- Absolute, traversal, and unsafe output paths fail.
- A valid release can be generated under different local output roots without
  changing the release payload.
- Expected generated files are deterministic.

### Done When

This workflow succeeds:

```text
Workbench publish -> API -> dso pull -> signature verification -> dso generate
```

## W7: Deployment, Network Security, and Secure SDLC

Align with W7 in `relational-databases.md`.

### Build

- Deploy the web/API service behind HTTPS.
- Keep PostgreSQL private and expose only the required API port.
- Restrict database access to the application network.
- Use separate development, migration, and runtime credentials.
- Configure a least-privilege runtime database user.
- Add request limits and basic rate limits for login, API-key verification, mutations, and release downloads.
- Add CI checks for:
  - Typecheck
  - Lint
  - Unit and integration tests
  - Dependency vulnerabilities
  - Accidentally committed secrets
- Document physical-security assumptions and provider responsibilities.
- Document secret injection, key rotation, session expiration, log redaction, backups, and incident-response limitations.

### Done When

The deployed service uses HTTPS, PostgreSQL is not directly exposed, and security checks run in CI.

## W8: End-to-End Verification and Submission

Align with W8 in `relational-databases.md`.

### Final Workflow

1. Start PostgreSQL.
2. Run migrations.
3. Seed fake data.
4. Start the workbench/API.
5. Log in.
6. Edit tokens, components, and templates.
7. Publish a release.
8. Create and use a scoped CLI API key.
9. Run `dso pull` over HTTPS.
10. Verify the release signature.
11. Run `dso generate`.
12. Inspect JSON, CSS, and Markdown output.
13. Run repository tests, workbench tests, CLI tests, typecheck, lint, security scans, and smoke tests.

### Required Security Tests

- Invalid login fails.
- Unauthenticated routes fail.
- Cross-project access fails.
- Insufficient role or scope fails.
- Malformed and oversized requests fail.
- SQL injection payloads do not alter queries.
- CSRF protection rejects unsafe requests.
- Revoked keys fail.
- Unpublished releases cannot be downloaded.
- Invalid signatures stop generation.
- Path traversal fails.
- A failed transaction rolls back.
- Logs and generated files contain no secrets.
- Cross-project token references are rejected.
- Self-referencing tokens are rejected.
- Duplicate token references are rejected.
- Invalid token-type parents are rejected.
- Cyclic token-type hierarchies are rejected.
- Unauthorized users cannot modify token references or token-type hierarchy data.
- Signed releases preserve token references and token-type hierarchy data.

### Hand-In Evidence

- Threat model and data-flow diagram
- List of implemented security measures
- Test results
- Authentication and authorization flow
- Input-validation and SQL-injection controls
- TLS and cryptography explanation
- Digital-signature and key-management explanation
- Web-threat mitigation table
- Secure SDLC and operational-security checklist
- Implemented, open, and excluded risks

## Level 1 Requirement Mapping

- Cybersecurity dimensions: W1 and W7
- Threat model analysis: W1
- Physical, network, transport, application, and data threats: W1, W5, and W7
- Authentication and authorization: W3 and W5
- Validation: W3 and W5
- Encryption and TLS: W6 and W7
- Digital signing: W6
- Key management: W2 and W6
- Web application security: W5
- Secure development and operation: W7 and W8
- Documentation and oral presentation: W8

## Oral Examination Preparation

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

Be able to explain the CIA triad plus authenticity and non-repudiation, OAuth 2.0 and OpenID Connect at a conceptual level, and why those protocols are not implemented in this project.
