## New project direction

DSO is a database-backed workbench for authoring and publisihg agent-first design system resources. It stores token contracts, component registration, and markdown document templates. An authenticated CLI installs a published resource version into a team repository and locally generates agent-readable component decuments and design-token.json.

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

DSO does not claim to know which tokens are used by component source code. Component-token usage analysis is out of scope for the first release.

DSO models relationships within the token domain:

- token types form a single-parent hierarchy
- tokens can reference other tokens
- mode-aware token references identify which value mode is being referenced
- token references support reverse dependency queries

A token type can have zero or one parent. The hierarchy is represented with `parent_type_id`; a separate token-type relationship table is not required.

Source-code scanning and automatic component-token discovery remain future work.

#### Requirment evidence

The architecture includes a real application data layer, not a standalone database script.

#### Done when

Use cases, terminology, architecture, and first ER model are documented

### W2: Relational schema and migrations

#### Tasks

- Create migrations for
  - `projects`
  - `releases`
  - `token_types(parent_type_id)`
  - `tokens`
  - `token_references`
    - `referencing_token_id`
    - `referenced_token_id`
    - `mode`
  - `components`
  - `document-templates`
- Add
  - primary keys
  - foreign keys
  - unique constraints
  - check constraints where useful
  - indexes
  - release relationships
- Constraints
  - A token type has zero or one parent.
  - A root token type has a null `parent_type_id`.
  - A token type cannot be its own parent.
  - A parent token type must belong to the same project.
  - Cyclic token-type hierarchies are rejected.
  - A token cannot reference itself.
  - Duplicate token references are rejected for the same referencing token, referenced token, and mode.
  - A mode-aware reference must identify a mode supported by the referencing token value.
  - Referenced tokens must belong to the same project.
  - Referencing and referenced tokens must exist.

#### Requirement evidence

Tables, rows, columns, keys, and relationships are implemented

#### Done when

The complete schema can be created from an empty PostgreSQL database.

### W3: Seed data and SQL operations

#### Tasks

- Import the supported token definitions from `design-tokens-manifest.json` as seed input.
- Treat legacy `class-union` and `unknown` kinds as deprecated input; they are not part of the published domain contract and are excluded or rejected during seed normalization.
- Add token types and their parent-child hierarchy.
- Add token-to-token references, including the referenced mode where a token uses mode-specific values.
- Add realistic components and Markdown templates.
- Record row counts and data-generation method.
- Implement basic SQL
  - insert
  - update
  - filtering
  - ordering
- Implement advanced SQL
  - joins
  - self-joins
  - token-reference queries
  - reverse token-reference queries
  - token-type hierarchy queries
  - aggregates
  - unreferenced-token analysis
  - complete release query
  - upsert

#### Requirment evidence

SQL is used for meaningful DSO use cases, not artificial examples.

#### Done when

The database contains inspectable, non-trival data and documented queries

### W4: Data-access module

- Create `packages/db` with
  - PostgreSQL connection pool
  - Parameterized SQL
  - Repository functions
  - Transaction helpers
- Implement operation such as
  - `getPublishedRelease`
  - `listTokensByType`
  - `getReferencedTokens`
  - `getReferencingTokens`
  - `getReferencingTokensByMode`
  - `getTokenTypeChildren`
  - `getTokenTypeAncestors`
  - `getTemplateForComponent`
  - `saveStagedTokenChanges`
- Add tests for
  - Successfull queries
  - Empty results
  - Joins
  - Foreign key failures
  - Uniquness failures
  - Token-reference joins
  - Reverse token-reference queries
  - Token-type hierarchy queries
  - Cross-project reference failures
  - Self-reference failures
  - Duplicate-reference failures
  - Invalid mode-reference failures
  - Transaction rollback after a failed relationship update

#### Requirement evidence

Application code accesses the database through a reusable data layer

#### Done when

All application database operations use tested repositories.

### W5: Workbench and API integration

#### Tasks

- Replace filesystem loading in `WorkbenchShell`
- Replace JSON persistence in `route.ts`
- Preserve staged editing in `StagedManifestContext` and `useStagedManifestActions`
- Convert database records into the existing `TokenGraphModle`
- Add simple API-key authentication.
- Support
  - token editing
  - token-reference editing
  - token-type hierarchy editing
  - component registration
  - template assignment
  - release publishing

#### Requirement evidence

The data layer supports a working application, and PostgreSQL becomes the source of truth.

#### Done when

Normal workbench usage no longer reads or write `design-toekns-manifest.json`

### W6: Transactions, release, CLI, and generation

#### Tasks

- Save staged changes inside a transaction.
- Demonstarte rollback when one update fails.
- Add an authenticated published-release API.
- Include token definitions, token references, token-type hierarchy data, components, and templates in the published release.
- Ensure the release snapshot does not claim to contain source-code component-token usage.
- Create `apps/cli` with:
  - `dso pull`
  - `dso generate`
- Store downloaded resources udner `dso`
- Generate
  - `tokens.json`
  - `tokens.css`
  - component markdown
- Keep the CLI dependend on the API, never directly on PostgreSQL.

#### Requirement evidence

ACID behavior is demonstarted in the actual application.

#### Done when

Workbench publish -> API -> CLI pull -> local generation works end to end

### W7: Performance, scaling, and ORM understanding

- Use `EXPLAIN ANALYZE` on repressentative queries.
- Compare indexed and inefficient query plans.
- Verifiy indexes for
  - project/release token lookup
  - token-type lookup
  - token-reference lookup
  - reverse token-reference lookup
  - token-type hierarchy lookup
- Document
  - connection pooling
  - caching
  - read replicas
  - API statelessness
  - larger releases
  - migration/version management
- Compare raw SQL, ORMs, and data mappers.
- Explain why this project uses raw SQL through a repository layer.

#### Requirment evidence

Indexing, query optimization, scaling, and ORM/data-access understanding are supported by evidence.

#### Done when

Performance measurements and design explanations are ready for the report.

### W8: Documentation and final verification

- Complete
  - README with PostgreSQL setup
  - Migration and seed instructions
  - CLI configuration and usage
  - Use-case document with implemented / stretch status
  - ER model with keys, cardinality, constraints, and indexes
  - Data-volume and seed-generation explanation
  - SQL examples
  - Token-type hierarchy and token-reference explanation
  - Reverse token-reference query examples
  - Source-code scanning scope limitation
  - Transaction and rollback explanation
  - Indexing and `EXPLAIN ANALYZE` results
  - Normalization explanation
  - Scaling discussion
- Run the final workflow from an empty database
  1.  Start PostgreSQL
  2.  Run migrations
  3.  Seed data
  4.  Start the workbench
  5.  Edit and publish resources
  6.  Run `dso pull`
  7.  Run `dso generate`
  8.  Inspect Markdown, JSON, CSS, token references, and token-type hierarchy data
  9.  Run repository tests, workbench tests, typecheck, lint, and smoke tests

## Requirement Coverage

- Relational fundamentals: schema, keys, foreign keys, and relationships.
- Normalization: separate entities and join tables.
- SQL: basic operations, joins, aggregates, upserts, and release queries.
- Performance: indexes and EXPLAIN ANALYZE.
- ACID: transactional staged saves and rollback tests.
- Scaling: documented limitations and future strategies.
- Data access: packages/db used by the API and workbench.
- ORM understanding: documented comparison and design rationale.
- Practical project: workbench, API, CLI, and generators.
- Non-trivial model: multiple entities, token-type hierarchy, and token-reference relationships.
- Hand-in requirements: README, use cases, ER model, setup instructions, and data explanation.

## Deliberate Exclusions

Keep these as strech goals.

- OAuth
- Multi-tenant authentication
- Multiple database engines
- Cloud scaling
- Advanced release branching
- Automatic source-code scanning and component-token discovery
- Full production deployment
- Maintaining both a raw SQL and ORM implementation
