# Migration Verification

## Environment

- Database: `dso_empty_test`
- PostgreSQL client: 18.6
- PostgreSQL server: 16.15 (Homebrew)
- Starting state: empty database
- Verification date: 2026-10-20

## Migration Result

Migrations `001` through `005` were applied in numeric order without errors.
The schema was created successfully from the empty database.

## Tables Verified

- `projects`
- `releases`
- `token_types`
- `components`
- `tokens`
- `document_templates`
- `token_references`

## Schema Inspection

The `token_references` table was inspected with `\d` and confirmed to contain:

- `referencing_token_id`
- `referenced_token_id`
- `project_id`
- `slot`
- Primary-key protection for the reference identity
- Same-project foreign keys to `tokens`
- Slot allow-list check constraint
- Self-reference check constraint

The database index list was inspected with `\di`. The expected primary-key,
unique, lookup, and relationship indexes were present.

## Evidence Status

- Empty-database migration: completed
- Table creation: verified
- Constraint and index creation: verified
- Valid-row tests: pending or recorded separately
- Invalid-row tests: pending or recorded separately
