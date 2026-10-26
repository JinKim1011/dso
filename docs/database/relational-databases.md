## Project direction

DSO is a database-backed workbench for authoring and publisihg agent-first web design system resources. It stores token contracts, component registration, and markdown document templates. An authenticated CLI installs a published resource version into a team repository and locally generates agent-readable component decuments and design-token.json.

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
  - Semantic color and shadow tokens use a `modes` value with `light` and `dark` entries.
  - Typography has primitive and semantic token types.
  - Typography primitive type names are `font-size`, `font-weight`, and `line-height`.
  - Typography primitive tokens use a `single` value.
  - Typography semantic tokens use a `typography` value with `fontSize`,
    `fontWeight`, and `lineHeight` fields.
  - A token cannot reference itself.
  - Duplicate token references are rejected for the same referencing token, referenced token, and slot.
  - A token reference slot must be supported by the referencing token value and type.
  - A semantic color or shadow token may reference only a primitive token of the same category.
  - A referenced primitive color or shadow token must provide a `single` value.
  - Primitive color and shadow references resolve their `single` value for the selected `light` or `dark` slot.
  - A semantic typography token may reference only the primitive typography type
    corresponding to the selected slot.
  - Typography references map `fontSize` to `font-size`, `fontWeight` to
    `font-weight`, and `lineHeight` to `line-height`.
  - Referenced tokens must belong to the same project.
  - Referencing and referenced tokens must exist.
  - A component document path is relative to the CLI output root.
  - Component document paths use `/` separators and cannot be absolute or contain `..` path segments.
  - A document template belongs to a component in the same project.
  - Document templates are Markdown in the first release.

#### Requirement evidence

Tables, columns, keys, relationships, constraints, and indexes are implemented.

- [ER model](../../docs/database/er-model.md)
- [Migrations](../../database/migrations/001_create_base_schema.sql) through
  `007_add_indexes.sql`
- [Migration verification](../../docs/database/migration-verification.md)
- [Token hierarchy validator](../../packages/contracts/validation/token-type-hierarchy.ts)
- [Token reference validator](../../packages/contracts/validation/token-reference.ts)
- [Document path validator](../../packages/contracts/validation/document-path.ts)

#### Done when

The complete domain and security schema can be created from an empty PostgreSQL database, and its structural constraints and indexes have been verified. Runtime database-role provisioning remains part of deployment and database administration rather than application schema migrations.

### W3: Seed data, contracts, authentication, and database access

This week establishes the foundation for every later integration.

#### Build

- Normalize supported definitions from `design-tokens-manifest.json`.
- Exclude or reject deprecated `class-union` and `unknown` kinds.
- Seed realistic users, projects, memberships, token types, tokens, references, components, templates, and releases.
- Record seed row counts and the data-generation method.
- Implement documented SQL for inserts, updates, filtering, ordering, joins, self-joins, aggregates, upserts, release queries, hierarchy queries, reverse-reference queries, and unreferenced-token analysis.
- Create `packages/db` with a PostgreSQL pool, parameterized SQL, repositories, and transaction helpers.
- Implement repositories for published releases, token and hierarchy queries, templates, staged changes, project membership, API-key verification, and audit events.
- Add shared contracts and validation for login, resource writes, publishing, API keys, and release downloads.
- Implement password hashing, database-backed sessions, expiration, and logout.
- Require authorization context for protected repository operations.

#### Tests and evidence

- Verify valid and invalid login, expired sessions, empty results, joins foreign-key and uniqueness failures, SQL-injection payloads, cross-project references, self-references, duplicate references, invalid slots, cyclic hierarchies, and transaction rollback.
- Record meaningful SQL examples rather than artificial queries.

#### Done when

Authenticated and authorized repository operations work against PostgreSQL, the database contains inspectable seed data, and all application database access goes through tested repositories.

### W4: Workbench integration and web security

This week replaces the current persistence path while preserving the existing staged-editing experience.

#### Build

- Replace filesystem loading in `WorkbenchShell`.
- Replace JSON persistence in `route.ts`.
- Preserve `StagedManifestContext` and `useStagedManifestActions`.
- Convert database records into the existing token graph model.
- Persist token edits, token references, token-type hierarchy changes,
  components, templates, and releases.
- Implement protected workbench routes for login, logout, session lookup,
  project reads, resource edits, publishing, API-key creation/revocation, and
  published-release reads.
- Enforce the role model:
  - Editor: read and edit project resources.
  - Publisher: editor permissions plus release publishing.
  - Admin: publisher permissions plus API-key management.
- Add project authorization, CSRF protection for cookie mutations, security
  headers, generic production errors, and audit events.

#### Tests and evidence

- Verify unauthenticated requests, cross-project access, insufficient roles,
  CSRF failures, security headers, audit events, and staged editing.
- Demonstrate that PostgreSQL is the source of truth and normal workbench
  usage no longer reads or writes `design-tokens-manifest.json`.

#### Done when

An authenticated user can edit only authorized projects, role restrictions are
enforced, and a user can publish through the workbench.

### W5: Release signing, CLI, and generation

This week delivers the complete publish-to-generation vertical slice.

#### Build

- Create an authenticated published-release API containing token definitions,
  references, token-type hierarchy data, components, and templates.
- Keep source-code component-token usage claims out of the release snapshot.
- Canonicalize release JSON and sign it with Ed25519.
- Create `apps/cli` with `dso pull` and `dso generate`.
- Implement project-scoped API-key validation for identifier, hash, project,
  scope, expiration, and revocation.
- Return API-key secrets only once and store only hashes.
- Require HTTPS outside local development and keep the CLI dependent on the
  API, never PostgreSQL.
- Verify release signatures before generation and stop on failure.
- Generate `tokens.json`, `tokens.css`, and component Markdown.
- Resolve portable component document paths below a configured local output
  root; reject absolute paths, `..` traversal, unsafe separators, and shell
  execution based on release data.
- Make generated output deterministic and keep credentials out of output.

#### Tests and evidence

- Verify invalid, expired, revoked, wrong-scope, and wrong-project keys.
- Verify invalid signatures stop generation, valid releases work under
  different output roots, unsafe paths fail, output is deterministic, and the
  CLI never connects to PostgreSQL.

#### Done when

This workflow succeeds:

```text
Workbench publish -> signed release API -> dso pull
-> signature verification -> dso generate
```

### W6: Performance, deployment security, documentation, and final verification

This week completes evidence, hardening, and the clean end-to-end run.

#### Build and evidence

- Run `EXPLAIN ANALYZE` on representative project/release, token-type,
  token-reference, reverse-reference, hierarchy, and complete-release queries.
- Compare indexed and inefficient plans and verify the planned indexes.
- Document connection pooling, caching, read replicas, API statelessness,
  larger releases, migration management, scaling limits, and the raw SQL
  versus ORM/data-mapper decision.
- Document HTTPS, private PostgreSQL networking, separate migration/runtime
  credentials, least privilege, request/rate limits, dependency scanning,
  secret scanning, log redaction, key rotation, backups, and incident limits.
- Complete the README, setup and seed instructions, CLI usage, use-case status,
  ER model, SQL examples, normalization, transaction, performance, scaling,
  hierarchy, reference, and source-scanning scope documentation.
- Run from an empty database: migrations, seed, workbench login, editing,
  publishing, API-key creation, CLI pull, signature verification, generation,
  output inspection, tests, typecheck, lint, and smoke checks.

#### Done when

Performance measurements, security evidence, documentation, and the complete
empty-database workflow are ready for the report and final demonstration.

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
