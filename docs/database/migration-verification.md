# Migration Verification

## Environment

- Database: `dso_empty_test`
- PostgreSQL client: `18.6`
- PostgreSQL server: `16.15`
- Starting state: empty database
- Verification date: `2026-10-22`
- Migration directory: `database/migrations`

## Migration Result (empty database)

- Status: completed
- Result: all migrations applied successfully

Migrations `001` through `007` were applied in numeric order to an empty PostgreSQL database without errors. The schema was created successfully from an empty database.

Applied migrations:

1. `001_create_base_schema.sql`
2. `002_create_users.sql`
3. `003_create_dependent_tables.sql`
4. `004_create_token_references.sql`
5. `005_create_security_tables.sql`
6. `006_add_constraints.sql`
7. `007_add_indexes.sql`

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

### Security tables

- `users`
- `sessions`
- `project_members`
- `api_keys`
- `audit_events`

## Foreign-Key Relationships Verified

- Status: completed
- Result: All 19 expected domain and security foreign-key constraints were inspected, including the composite same-project foreign keys.

### Domain relationships

The direct token foreign keys enforce token existence.

- `releases.project_id` references `projects.id`
- `token_types.project_id` references `projects.id`
- `token_types.(project_id, parent_type_id)` references
  `token_types.(project_id, id)`
- `tokens.project_id` references `projects.id`
- `tokens.(project_id, token_type_id)` references
  `token_types.(project_id, id)`
- `components.project_id` references `projects.id`
- `document_templates.project_id` references `projects.id`
- `document_templates.(project_id, component_id)` references
  `components.(project_id, id)`

### Token-reference relationships

The composite foreign keys enforce that the referenced tokens belong to the same project as the token-reference row.

- `token_references.project_id` references `projects.id`
- `token_references.referencing_token_id` references `tokens.id`
- `token_references.referenced_token_id` references `tokens.id`
- `token_references.(project_id, referencing_token_id)` references
  `tokens.(project_id, id)`
- `token_references.(project_id, referenced_token_id)` references
  `tokens.(project_id, id)`

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

## Indexes Verified

- Status: completed
- Result: all lookup and pk/fk indexes were present. (32 rows)

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

A unique constraint may create the index used for API-key identifier lookup.

## Invalid-Row Tests

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
- Invalid token reference: completed

## Notes

- Project ownership and release publishing permissions are inferred from `project_members`. The user who performs a publish action must be recorded through `audit_events`.
- Release signatures, signing-key identifiers, immutable release contents, and application-level authorization tests are outside this migration verification record.
- Runtime database roles and privileges will be managed through development/deployment database administration rather than application schema migrations.
  - A migration role with schema-definition privileges
  - A runtime role with only the application data-access privileges
  - to be verified when the database access layer and deployment configuration are implemented.
