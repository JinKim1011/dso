## Project direction

DSO is a database-backed workbench for authoring and publishing agent-first web design-system resources. It stores token contracts, component registration, and Markdown document templates. An authenticated CLI installs a published release into a team repository and generates `tokens.json` and `tokens.css`.

## Outline

DSO remains a single monorepo. PostgreSQL runs as a separate runtime service, while the repository contains the database migrations, seed data, data-access layer, API, CLI, generators, and documentation.

## Weekly Plan

### W1: Scope and architecture

#### Tasks

- Define the baseline use cases and terminology.
  - token
  - token type
  - token type hierachy
  - token referecne
  - component registration
  - per-component document template
  - published release
  - generated document
  - generated styles
- Define domain types separately from the exisiting `TokenGraphViewModel`
- Confirm repository boundaries
  - `apps/workbench`
  - `apps/cli`
  - `packages/db`
  - `packages/contracts`
  - `packages/generator`
  - `database/migrations`
  - `database/seed`
  - `apps/docs`
- Draft the API response for a published release.
- Create the first ER-model draft

#### Scope decision

- DSO does not claim to know which tokens are used by component source code.
- DSO models relationships within the token domain:
  - token types form a single-parent hierarchy
  - tokens can reference other tokens
  - token-reference slots identify which value slot is being referenced
  - token references support reverse dependency queries
- A token type can have zero or one parent. The hierarchy is represented with `parent_type_id`. (a separate token-type relationship table is not required.)
- Source-code scanning and automatic component-token discovery remain future work.

#### Requirment evidence

The architecture includes a real application data layer, not a standalone database script.

#### Done when

Use cases, terminology, architecture, and first ER model are documented

### W2: Relational schema and migrations

#### Tasks

- Create migrations for
  - `projects`
  - `releases`
  - `users`
  - `token_types(parent_type_id)`
  - `tokens`
  - `token_references`
    - `referencing_token_id`
    - `referenced_token_id`
    - `project_id`
    - `slot`
  - `components`
    - `id`
    - `project_id`
    - `name`
    - `slug`
    - `description`
    - `document_path`
  - `document_templates`
    - `id`
    - `project_id`
    - `component_id`
    - `name`
    - `content`
  - `sessions`
  - `project_members`
  - `api_keys`
  - `audit_events`
- Infer project ownership and release-publishing permissions from `project_members`. W2 does not add `projects.owner_id` or `releases.published_by`. The application records the publishing user in `audit_events`.
- Add
  - primary keys
  - foreign keys
  - unique constraints
  - check constraints where useful
  - indexes
  - release relationships
- Add security constraints for
  - unique user email
  - unique project membership
  - valid project-member roles
  - unique API-key identifiers
  - valid API-key scopes
  - session expiration after creation
  - API-key expiration after creation
- Add security indexes for
  - session expiry
  - project membership by user
  - audit events by project and creation time
- Allow account-level audit events without a project or resource, while requiring project and resource identifiers for project-scoped audit actions.
- Constraints
  - A token type has zero or one parent.
  - A root token type has a null `parent_type_id`.
  - A token type cannot be its own parent.
  - A parent token type must belong to the same project.
  - Cyclic token-type hierarchies are rejected.
  - Primitive color and shadow tokens use a `single` value.
  - Semantic color and shadow tokens use a `modes` value; `light` and `dark` slots are optional.
  - Typography has primitive and semantic token types.
  - Typography primitive type names are `font-size`, `font-weight`, and `line-height`.
  - Typography primitive tokens use a `single` value.
  - Typography semantic tokens use a `typography` value with optional `fontSize`, `fontWeight`, and `lineHeight` slots.
  - Token-reference rows identify targets by token ID and slot; CSS variables are separate token properties and are not reference identities.
  - A missing token-reference row means that slot has no assigned reference.
  - A token cannot reference itself.
  - Duplicate token references are rejected for the same referencing token, referenced token, and slot.
  - A token reference slot must be supported by the referencing token value and type.
  - A semantic color or shadow token may reference only a primitive token of the same category.
  - A referenced primitive color or shadow token must provide a `single` value.
  - Primitive color and shadow references resolve their `single` value for the selected `light` or `dark` slot.
  - A semantic typography token may reference only the primitive typography type corresponding to the selected slot.
  - Typography references map `fontSize` to `font-size`, `fontWeight` to `font-weight`, and `lineHeight` to `line-height`.
  - Referenced tokens must belong to the same project.
  - Referencing and referenced tokens must exist.
  - A component document path is relative to the CLI output root.
  - Component document paths use `/` separators and cannot be absolute or contain `..` path segments.
  - A document template belongs to a component in the same project.
  - Document templates are Markdown in the first release.

#### Requirement evidence

Tables, columns, keys, relationships, constraints, and indexes are implemented.

- [ER model](../../docs/database/er-model.md)
- [Migrations](../../database/migrations/001_create_base_schema.sql) through `008_add_indexes.sql`
- [Migration verification](../../docs/database/migration-verification.md)
- [Token hierarchy validator](../../packages/contracts/validation/token-type-hierarchy.ts)
- [Token reference validator](../../packages/contracts/validation/token-reference.ts)
- [Document path validator](../../packages/contracts/validation/document-path.ts)

#### Done when

The complete domain and security schema can be created from an empty PostgreSQL database, and its structural constraints and indexes have been verified. Runtime database-role provisioning remains part of deployment and database administration rather than application schema migrations.

### W3: Seed data, contracts, authentication, and database access

This week establishes the foundation for every later integration.

#### Build

- Treat `design-tokens-manifest.json` as a legacy workbench compatibility input, not as the canonical database seed format.
- Define and seed current domain records directly for users, projects, project memberships, token types, tokens, token references, components, document templates, and releases.
- If legacy manifest data is reused during development, pass it through an explicit adapter that accepts only primitive and semantic kinds. Reject class-union, unknown, and other unsupported kinds before domain conversion.
- Record seed row counts and the data-generation method.
- Implement documented SQL for inserts, updates, filtering, ordering, joins, self-joins, aggregates, upserts, release queries, hierarchy queries, reverse-reference queries, and unreferenced-token analysis.
- Create `packages/db` with a PostgreSQL pool, parameterized SQL, repositories, and transaction helpers.
- Implement repositories for published releases, token and hierarchy queries, templates, staged changes, project membership, API-key verification, and audit events.
- Add shared contracts and validation for login, resource writes, publishing, API keys, and release downloads.
- Implement password hashing, database-backed sessions, expiration, and logout.
- Require authorization context for protected repository operations.
- W3 delivers authenticated workbench-session access to application services. API-key-authenticated release downloads are deferred to W5 with the CLI and release-signing vertical slice.

#### Tests and evidence

- Verify valid and invalid login, expired sessions, empty results, joins foreign-key and uniqueness failures, SQL-injection payloads, cross-project references, self-references, duplicate references, invalid slots, cyclic hierarchies, and transaction rollback.
- Record meaningful SQL examples rather than artificial queries.

#### Done when

Authenticated and authorized repository operations work against PostgreSQL, the database contains inspectable seed data, and all application database access goes through tested repositories.

### W4: Workbench integration and web security

This week replaces the legacy manifest persistence path with PostgreSQL while preserving the existing staged-editing experience.

#### Build

Delivered:

- `loadWorkbenchProject` loads project records in the workbench layout and an adapter converts them into the token graph model.
- `StagedContext` and `useStagedActions` are preserved. Drafts stay on the client until the user pushes them.
- A single operation, `POST /api/releases/publish`, saves staged token/reference changes and publishes a release atomically. It uses a project-locked `READ COMMITTED` transaction, validates the final project state, assigns the next sequential version, and rolls back everything on failure. Empty batches are rejected. The standalone save API and per-row push were removed.
- Login, logout, and session lookup routes use the configured session cookie and map the session to the application authorization context. The workbench layout and project list redirect unauthenticated users to `/login` (project access is checked before project data is returned.)
- Role model:
  - Editor: read project resources and edit client-side drafts.
  - Publisher: editor permissions plus saving and publishing. Because saving and publishing are one operation, persisting edits requires this role.
  - Admin: publisher permissions plus API-key management (service level).
- Every cookie-based mutation (login, logout, publish) applies the shared CSRF policy. Responses carry security headers (the Content Security Policy is report-only.)
- API errors go through one mapper. Expected errors return stable status codes; unexpected errors return a generic 500 with a correlation ID.
- Audit events: `login.succeeded`, `login.failed`, `logout`, `token.batch_saved`, `release.published`, `api_key.created`, `api_key.revoked`. Saves and publishes record events in the same transaction.
- The seed script hashes `DSO_SEED_USER_PASSWORD` for all development users so the documented role accounts can log in.

Deferred:

- Production enablement. Login, logout, and publishing work only in development, so W4 is not production-ready until this is enabled and verified.
- Rate limiting, enforcing the CSP, and a CSP report collection endpoint (W6).
- Published-release read API (`GET /api/releases/:releaseId`), API-key create/revoke routes, and the CLI `release:read` flow (W5). The services and audit events exist, but there are no HTTP routes or UI yet.
- Persisting token-type hierarchy, component, and template changes through the workbench. These need routes and UI, and hierarchy edits also require React Flow logic updates. They are outside the remaining W4 scope and are tracked as post-W5 work.
- Request-ID based duplicate-publish protection. A lost publication response cannot be matched to its request; see the security plan.
- Editor-only saving without publishing.

#### Tests and evidence

- Verified: unauthenticated requests, CSRF failures, insufficient roles, atomic rollback, audit events, and staged editing, as covered by the existing workbench and PostgreSQL integration tests (not re-run during the W4 documentation review). Not every plan item has a dedicated test; for example, security-header presence is not asserted.
- PostgreSQL is the source of truth and normal workbench usage does not read or write `design-tokens-manifest.json`.

#### Done when

An authenticated user can edit only authorized projects, role restrictions are enforced, and a publisher can save and publish through the workbench in development. Production enablement and the deferred items above remain open.

### W5: Signed token release, CLI, and generation

This week delivers the complete publish-to-token-artifact vertical slice. Components and templates stay in the immutable release snapshot for forward compatibility, but won't consume them for generation.

#### Build

##### Day 1: API-key and release boundary

- Add `GET /api/releases/:releaseId` for an authorized session or project-scoped CLI API key.
- Return the full existing snapshot contract, including token types, tokens, references, components, and templates. Only token definitions, hierarchy, and references are W5 generator inputs.
- Add admin-only API-key create/revoke routes with CSRF protection and audit events.
- Issue one combined credential in the form `dso_<keyIdentifier>_<secret>`. The user sees it only once, and the database stores only its hash.
- Read the credential from `DSO_API_KEY`. Parse the identifier, verify the hash and then enforce project, `release:read` scope, expiration, revocation, and published status.

##### Day 2: Shared signing protocol and `dso pull`

- Add a database-independent `@repo/release-protocol` package for stable canonicalization, Ed25519 signing, and verification.
- Sign the canonical release payload while excluding the signature envelope.
- Add `apps/cli` with `dso pull`; require HTTPS outside local development and keep PostgreSQL entirely behind the API.
- Read trusted public keys and key IDs from a local CLI trust file. Multiple key IDs may be trusted during rotation, but a key supplied by the release response is not a trust authority.
- Reject unknown schema versions, signatures, or key IDs without changing the verified cache.

##### Day 3: Deterministic token generation

- Implemented `@repo/generator` and `dso generate` for `tokens.json` and `tokens.css`.
- Resolve semantic references to deterministic `var(--derived-primitive-name)` aliases. The release's legacy `cssVar` field is not consumed by the generator.
- Generate primitive custom properties, mode values in `:root`/`[data-theme="dark"]`, and typography utility classes in standalone `@layer components`.
- Do not generate component Markdown, render templates, or interpret component `documentPath` values.
- Ask before replacing existing generated artifacts in an interactive run. Require `--force` to replace them without a prompt.
- In non-interactive runs, fail on conflicts unless `--force` is supplied.
- Limit overwrite to `tokens.json` and `tokens.css`, preserve unrelated files, stage both artifacts, and roll back command failure after either rename.
- Re-read and re-verify the cached signed envelope before generation. Generation is offline and never pulls from the API.

#### Tests and evidence

- Verify invalid, expired, revoked, wrong-scope, and wrong-project keys.
- Verify modified payloads, invalid signatures, and unknown signing-key IDs stop before cache or output changes.
- Verify identical releases generate byte-identical token artifacts under different output roots.
- Verify confirmation, `--force`, non-interactive failure, unrelated-file preservation, all-or-nothing replacement, and safe generation failures.
- Verify no secret appears in logs or generated files and the CLI has no PostgreSQL dependency.

#### Done when

This workflow succeeds:

```text
Workbench publish -> signed release API -> dso pull
-> signature verification -> dso generate
-> deterministic tokens.json and tokens.css
```

#### Not in W5

- Component Markdown generation and template placeholders.
- Component `documentPath` consumption or release-driven path traversal concerns.
- Workbench edits for hierarchy, components, or templates.
- Source-code scanning and automatic component-token usage discovery.
- API-key management UI, rate limiting, CSP enforcement, production enablement, HSMs, or automatic signing-key infrastructure.

### W6: Performance, deployment security, documentation, and final verification

This week completes evidence, hardening, and the clean end-to-end run.

#### Build and evidence

- Run `EXPLAIN ANALYZE` on representative project/release, token-type, token-reference, reverse-reference, hierarchy, and complete-release queries.
- Compare indexed and inefficient plans and verify the planned indexes.
- Document connection pooling, caching, read replicas, API statelessness, larger releases, migration management, scaling limits, and the raw SQL versus ORM/data-mapper decision.
- Document HTTPS, private PostgreSQL networking, separate migration/runtime credentials, least privilege, request/rate limits, dependency scanning, secret scanning, log redaction, key rotation, backups, and incident limits.
- Complete the README, setup and seed instructions, CLI usage, use-case status, ER model, SQL examples, normalization, transaction, performance, scaling, hierarchy, reference, and source-scanning scope documentation.
- Run from an empty database: migrations, seed, workbench login, editing, publishing, API-key creation, CLI pull, signature verification, generation, output inspection, tests, typecheck, lint, and smoke checks.

#### Done when

Performance measurements, security evidence, documentation, and the complete empty-database workflow are ready for the report and final demonstration.

## Requirement Coverage

- Relational fundamentals: schema, keys, foreign keys, and relationships.
- Normalization: separate entities and join tables.
- SQL: operations, joins, aggregates, upserts, and release queries.
- Performance: indexes and `EXPLAIN ANALYZE`.
- ACID: transactional staged saves and rollback tests.
- Scaling: documented limitations and future strategies.
- Data access: `packages/db` used by the API and workbench.
- ORM understanding: documented comparison and design rationale.
- Practical project: workbench, API, CLI, and generators.
- Non-trivial model: token hierarchy and token-reference relationships.
- Hand-in requirements: setup, use cases, ER model, SQL, and data evidence.

## Deliberate Exclusions

Keep these as stretch goals:

- OAuth
- Multi-tenant authentication
- Multiple database engines
- Cloud scaling
- Advanced release branching
- Automatic source-code scanning and component-token discovery
- Full production deployment
- Maintaining both a raw SQL and ORM implementation
