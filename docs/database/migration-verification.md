# Migration Verification

## Environment

- Database: `dso_test`
- PostgreSQL client: `18.6`
- PostgreSQL server: `16.15`
- Starting state: empty database
- Updated: `2026-11-20`
- Migration directory: `database/migrations`

## Migration Result (empty database)

- Status: completed
- Result: all migrations applied successfully

Migrations `001` through `008` were applied in numeric order to an empty PostgreSQL database without errors. The schema was created successfully from an empty database.

Applied migrations:

1. `001_create_base_schema.sql`
2. `002_create_users.sql`
3. `003_create_dependent_tables.sql`
4. `004_create_token_references.sql`
5. `005_create_release_snapshots.sql`
6. `006_create_security_tables.sql`
7. `007_add_constraints.sql`
8. `008_add_indexes.sql`

## Tables Verified

- Status: completed
- Result: all domain and security tables created

### Domain tables

- `projects`
- `releases`
- `token_types`
- `tokens`
- `token_references`
- `components`
- `document_templates`
- `release_snapshots`

### Security tables

- `users`
- `sessions`
- `project_members`
- `api_keys`
- `audit_events`

### Migration metadata

- `migration_history`

## Foreign-Key Relationships Verified

- Status: completed
- Result: all 20 expected domain and security foreign-key constraints were inspected, including the composite same-project foreign keys.

### Domain relationships

The direct token foreign keys enforce token existence.

- `releases.project_id` references `projects.id`
- `token_types.project_id` references `projects.id`
- `token_types.(project_id, parent_type_id)` references `token_types.(project_id, id)`
- `tokens.project_id` references `projects.id`
- `tokens.(project_id, token_type_id)` references `token_types.(project_id, id)`
- `components.project_id` references `projects.id`
- `document_templates.project_id` references `projects.id`
- `document_templates.(project_id, component_id)` references `components.(project_id, id)`
- `release_snapshots.release_id` references `releases.id`

### Token-reference relationships

The composite foreign keys enforce that the referenced tokens belong to the same project as the token-reference row.

- `token_references.project_id` references `projects.id`
- `token_references.referencing_token_id` references `tokens.id`
- `token_references.referenced_token_id` references `tokens.id`
- `token_references.(project_id, referencing_token_id)` references `tokens.(project_id, id)`
- `token_references.(project_id, referenced_token_id)` references `tokens.(project_id, id)`

### Security relationships

- `sessions.user_id` references `users.id`
- `project_members.project_id` references `projects.id`
- `project_members.user_id` references `users.id`
- `api_keys.project_id` references `projects.id`
- `audit_events.user_id` references `users.id`
- `audit_events.project_id` references `projects.id`

## Constraints Verified

- Status: completed
- Result: The expected primary-key, unique, check, and foreign-key constraints were present for the domain and security tables.

### Domain constraints

- Project name uniqueness
- Project slug uniqueness
- Release version uniqueness within a project
- Valid release statuses
- Valid `published_at` state for published releases
- Token-type parent cannot be the token type itself
- Token-type parent must belong to the same project
- Token type and token must belong to the same project
- Token-reference slot allow-list
- Token cannot reference itself
- One token-reference target per referencing token and slot
- Component slug uniqueness within a project
- Document template and component must belong to the same project

### Security constraints

- User email uniqueness
- Project membership uniqueness
- Valid project-member roles:
  - `editor`
  - `publisher`
  - `admin`
- API-key identifier uniqueness
- Valid API-key scopes:
  - `release:read`
- API-key expiration after creation
- Session expiration after creation
- Account-level `login.succeeded` events require an account resource and no project or resource ID
- Account-level `logout` events require an account resource and no project or resource ID
- Failed login events require an account resource and no project
- Token-batch events require a token-batch resource, project ID, metadata, and no resource ID
- Project-scoped release events require a release resource, project ID, and resource ID
- Project-scoped API-key events require an API-key resource, project ID, and resource ID

## Indexes Verified

- Status: completed
- Result: all 34 indexes in the public schema were present.

The database index list was inspected with `\di`.

Verified indexes include:

- Release lookup by project
- Token-type lookup by project
- Token-type child lookup by parent
- Token lookup by project and token type
- Reverse token-reference lookup
- Component lookup by project
- Document-template lookup by component
- Session expiry lookup
- Project-membership lookup
- Audit-event lookup by project and creation time
- API-key identifier lookup
- Primary-key indexes for domain and security tables
- Unique-constraint indexes

A unique constraint may create the index used for API-key identifier lookup.

## Invalid-Row Tests

- Migration suite: 44 database integration tests passed
- Duplicate user email: completed
- Duplicate project membership: completed
- Invalid project-member role: completed
- Duplicate API-key identifier: completed
- Invalid API-key scope: completed
- API-key expiration before creation: completed
- Session expiration before creation: completed
- Missing user referenced by a session: completed
- Missing project referenced by an API key: completed
- Invalid release state: completed
- Missing release project: completed
- Duplicate release version within a project: completed
- Duplicate project slug: completed
- Cross-project token type: completed
- Cross-project token reference: completed
- Invalid token reference: completed
- Self-referencing token: completed
- Invalid audit actors and scopes: completed
- Invalid audit targets and metadata: completed
- Unknown audit action: completed
- Failed login and token-batch audit scopes: completed
- Project-scoped audit event without required identifiers: completed
- Login event with project or resource: completed

## Reproduction

Create the test database once:

```bash
docker exec dso-postgres createdb -U postgres dso_test
```

Run the database integration suite:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso \
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso_test \
npm --workspace @repo/db test
```

The suite applies migrations to the test database and executes the constraint, repository, seed, transaction, staged-write, and client integration tests.

## Notes

- Project ownership and release publishing permissions are inferred from `project_members`. The user who performs a publish action must be recorded through `audit_events`.
- Valid audit-event rows were accepted for account-level `login.succeeded`, project-scoped `release.published`, `api_key.created`, and `api_key.revoked` events. All audit-event tests were executed inside transactions and rolled back.
- Release signatures, signing-key identifiers, immutable release contents, and application-level authorization tests are outside this migration verification record.
- Runtime database roles and privileges will be managed through development/deployment database administration rather than application schema migrations.
  - A migration role with schema-definition privileges
  - A runtime role with only the application data-access privileges
  - to be verified when the database access layer and deployment configuration are implemented.
