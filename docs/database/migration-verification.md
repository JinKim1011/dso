# Migration Verification

This document records the latest evidence that the migrations create the expected database schema successfully.

Find relevant reads in:

- [ER model](./er-model.md) for schema structure and rule ownership.

## Latest verification

- Updated: `2026-11-20`
- Database: `dso_test`
- Starting state: empty database
- PostgreSQL: `16.15`
- PostgreSQL client: `18.6`
- Migration directory: `database/migrations`
- Status: passed

Migrations `001_create_base_schema.sql` through `008_add_indexes.sql` applied successfully to the empty database.

## Verified result

- 14 public tables, including `migration_history`
- 20 foreign-key constraints
- 34 indexes
- 44 database integration tests passed

The suite covers migrations, constraints, repositories, seed data, transactions, staged writes, SQL injection resistance, and PostgreSQL connectivity.

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

## Scope

This record covers schema creation and database behavior. Release signatures, signing-key identifiers, immutable release publication payloads, application authorization, and runtime database roles are verified outside this record.
