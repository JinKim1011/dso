# Migration Verification

This document records the latest evidence that the migrations create the expected database schema successfully.

Find relevant reads in:

- [ER model](./er-model.md) for schema structure and rule ownership.
- [published release API contract](./published-release-api.md) for the database snapshot exposed to clients.
- [workbench local development](./workbench-local-development.md) for PostgreSQL and workbench setup.

## Latest verification

- Updated: `2026-11-27`
- Database: `dso_test`
- Starting state: empty database
- PostgreSQL: `16.15`
- PostgreSQL client: `18.6`
- Migration directory: `database/migrations`
- Status: passed

Migrations `001_create_base_schema.sql` through
`009_add_publish_idempotency.sql` applied successfully to the empty database.

## Verified result

- 15 public tables, including `migration_history`
- 23 foreign-key constraints
- 36 indexes
- 46 database integration tests passed

The suite covers migrations, constraints, repositories, seed data, transactions,
staged writes, publish idempotency, SQL injection resistance, and PostgreSQL
connectivity.

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

Apply pending migrations without reseeding:

```bash
DIRECT_DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso \
npm run db:migrate
```

`DIRECT_DATABASE_URL` must use a direct migration connection. The Workbench
runtime must continue to use its pooled `DATABASE_URL`.

## Publish idempotency verification

The `009_add_publish_idempotency.sql` migration creates `publish_requests`.
Application integration coverage verifies sequential and concurrent replay,
payload-hash conflict detection, atomic rollback, and stored-response reuse.

Neon Production applied this migration on `2026-11-27`. Runtime DML privileges
for `publish_requests` are present, while runtime schema `CREATE` remains denied.

## Scope

This record covers schema creation and database behavior. Release signatures, signing-key identifiers, immutable release publication payloads, application authorization, and runtime database roles are verified outside this record.
