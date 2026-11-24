# Implemented security measures

This document inventories security controls implemented in application code and records their primary verification evidence. It does not claim that deployment, network, provider, or operational controls are complete.

Find relevant reads in:

- [threat model](./threat-model.md) for assets, trust boundaries, threats, and required failure behavior
- [published release API contract](../database/published-release-api.md) for the signed download contract
- [migration verification](../database/migration-verification.md) for database schema verification.

## Authentication and sessions

- Passwords are hashed and verified with Argon2id.
- Successful authentication uses an opaque database-backed session.
- Session cookies are `HttpOnly` and `SameSite=Lax`; the `Secure` attribute is enabled in production.
- Invalid, expired, and deleted sessions are rejected by application services.
- Invalid-login audit events are recorded without treating the attempted account as the authenticated actor.

Evidence:

- [`passwords.ts`](../../packages/application/src/services/passwords.ts)
- [`authentication.ts`](../../packages/application/src/services/authentication.ts)
- [`auth-session-cookie.ts`](../../apps/workbench/src/server/auth-session-cookie.ts)
- Authentication integration tests in `packages/application/test/`

## Authorization and project isolation

- Protected operations require an authenticated authorization context.
- Workbench release reads and writes verify project membership.
- Publishing is restricted to publisher and administrator roles.
- API-key creation and revocation are restricted to administrators.
- Release downloads verify API-key project scope and the `release:read` scope.
- Session and API-key access to inaccessible releases is mapped to not-found behavior.

Evidence:

- [`authorization.ts`](../../packages/application/src/services/authorization.ts)
- [`download-release.ts`](../../packages/application/src/services/download-release.ts)
- [`published-releases.ts`](../../packages/application/src/services/published-releases.ts)
- Workbench and application authorization tests

## Browser request security

- Cookie-based mutations enforce configured trusted-origin checks.
- Mutations require `X-DSO-CSRF: 1`.
- Present `Sec-Fetch-Site` metadata must be `same-origin`.
- Missing, invalid, or `null` origin configuration fails closed.
- Responses configure:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - production HSTS
  - report-only Content Security Policy

Evidence:

- [`csrf.ts`](../../apps/workbench/src/server/csrf.ts)
- [`next.config.js`](../../apps/workbench/next.config.js)
- [`security-headers.test.ts`](../../apps/workbench/test/security-headers.test.ts)

## Database and transaction security

- Database access uses parameterized repository queries.
- Schema constraints enforce project ownership, valid states, uniqueness, relationships, and audit scope.
- Token and reference writes use a project lock in a `READ COMMITTED` transaction.
- Staged changes, release creation, snapshot creation, publication, and audit writes roll back together on failure.
- The CLI has no PostgreSQL dependency and receives release data only through the API.
- Database errors are mapped to generic API responses without exposing SQL, credentials, or stack traces.

Evidence:

- [`project-transaction.ts`](../../packages/application/src/services/project-transaction.ts)
- [`database/migrations/`](../../database/migrations)
- [`constraints.integration.test.ts`](../../packages/db/test/constraints.integration.test.ts)
- [`publishing.integration.test.ts`](../../packages/application/test/publishing.integration.test.ts)

## API keys

- A combined `dso_<keyIdentifier>_<secret>` credential is returned only when a key is created.
- Only the secret hash is stored.
- Keys are project-scoped and support `release:read`.
- Active-key checks reject expired or revoked credentials.
- Wrong-project and wrong-scope access is rejected.

Evidence:

- [`api-key-credentials.ts`](../../packages/application/src/security/api-key-credentials.ts)
- [`api-keys.ts`](../../packages/db/src/repositories/api-keys.ts)
- [`api-keys.integration.test.ts`](../../packages/application/test/api-keys.integration.test.ts)

## Published-release integrity

- The Workbench signs the canonical unsigned release response with Ed25519.
- The envelope includes `algorithm`, `keyId`, and signature `value`.
- The CLI verifies the signature against an independently distributed local trust file.
- Unknown keys, modified payloads, malformed envelopes, and unsupported values are rejected.
- Responses are bounded and signature verification occurs before cache replacement or generation.
- CLI download rejects redirects, invalid UTF-8, malformed JSON, wrong content types, and oversized responses.
- Remote API URLs require HTTPS; plain HTTP is limited to loopback development.

Evidence:

- [`envelope.ts`](../../packages/release-protocol/src/envelope.ts)
- [`verify.ts`](../../packages/release-protocol/src/verify.ts)
- [`read-response.ts`](../../apps/cli/src/api/read-response.ts)
- [`release-client.ts`](../../apps/cli/src/api/release-client.ts)

## CLI and local-file safety

- The CLI owns only `tokens.json` and `tokens.css` under the approved output root.
- Release data is not executed as shell input.
- Generated paths and output conflicts are validated before writing.
- Interactive replacement requires confirmation; non-interactive replacement requires `--force`.
- Unrelated files are preserved.
- `dso generate` re-verifies cache size, UTF-8/JSON, envelope schema, signing key, signature, and release ID before generation.
- Generated artifacts use staging and per-file atomic rename with backup restoration on command failure.

Evidence:

- [`pull.ts`](../../apps/cli/src/commands/pull.ts)
- [`release-cache.ts`](../../apps/cli/src/cache/release-cache.ts)
- [`read-release-cache.ts`](../../apps/cli/src/cache/read-release-cache.ts)
- [`generate.ts`](../../apps/cli/src/commands/generate.ts)
- [`atomic-artifacts.ts`](../../apps/cli/src/output/atomic-artifacts.ts)
- CLI pull, cache, generation, overwrite, and transaction tests in `apps/cli/test/`

## Audit events

Implemented audit actions:

| Action              | Actor   | Project  | Resource type | Resource ID              | Metadata   |
| ------------------- | ------- | -------- | ------------- | ------------------------ | ---------- |
| `login.succeeded`   | User    | None     | `account`     | None                     | None       |
| `login.failed`      | Unknown | None     | `account`     | Target user ID, if found | None       |
| `logout`            | User    | None     | `account`     | None                     | None       |
| `token.batch_saved` | User    | Required | `token_batch` | None                     | `tokenIds` |
| `release.published` | User    | Required | `release`     | Release ID               | None       |
| `api_key.created`   | User    | Required | `api_key`     | API key ID               | None       |
| `api_key.revoked`   | User    | Required | `api_key`     | API key ID               | None       |

Successful domain actions and their audit records commit in the same transaction. Failed-login audit behavior follows its dedicated authentication transaction policy. `tokenIds` contains only unique IDs of actually changed tokens. Secrets and sensitive token content are excluded.

Evidence:

- [`007_add_constraints.sql`](../../database/migrations/007_add_constraints.sql)
- Audit-event repository and application integration tests

## Not included as implemented

This inventory intentionally excludes controls that require deployment or operational evidence, including production network isolation, deployed TLS, rate limiting, enforced CSP, secret scanning, vulnerability scanning, backups, monitoring, and incident response.
