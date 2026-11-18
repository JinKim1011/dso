# Database-Backed Workbench Setup

## Prerequisites

- Docker is installed and running.
- Run all commands from the repository root.

## 1. Start PostgreSQL

Start the existing container:

```bash
docker start dso-postgres
```

If the container does not exist, create it:

```bash
docker run --name dso-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dso \
  -p 5432:5432 \
  -d postgres:16
```

Wait until PostgreSQL is ready:

```bash
until docker exec dso-postgres pg_isready -U postgres -d dso; do
  sleep 1
done
```

## 2. Reset the Development Database

The seed is not idempotent, so recreate the development database:

```bash
docker exec dso-postgres dropdb -U postgres --if-exists dso
docker exec dso-postgres createdb -U postgres dso
```

## 3. Seed the Database

Run migrations and insert the current seed. The seed creates:

- `editor@example.test` with the `editor` role
- `publisher@example.test` with the `publisher` role
- `admin@example.test` with the `admin` role
- `nonmember@example.test` without project membership

Choose one development password. The script applies the same Argon2id hash to
all four seeded users and refuses to run without a password:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso \
DSO_SEED_USER_PASSWORD='<choose-a-dev-password>' \
npm run db:seed
```

## 4. Get the Project ID

The seed fixture generates a new project UUID each time:

```bash
docker exec dso-postgres \
  psql -U postgres -d dso \
  -c 'SELECT id, slug, name FROM projects;'
```

Copy the `id` for `design-system`.

## 5. Configure the Workbench

Edit [`apps/workbench/.env.local`](../../apps/workbench/.env.local):

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso
DB_POOL_MAX=10
DSO_WORKBENCH_PROJECT_ID=<project-id>
DSO_WORKBENCH_ORIGIN=http://localhost:3000
```

Replace `<project-id>` with the UUID returned in the previous step.
`DSO_WORKBENCH_ORIGIN` is the trusted origin for the
[CSRF policy](../security/threat-model.md#csrf-policy). It must be an origin
without a path, and mutation requests fail without it. Login, logout, and
publishing work only in development (`npm run dev`).

## 6. Start the Workbench

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the seeded
email and the password you chose.

Restart the dev server whenever `.env.local` changes.

## 7. Run Database Tests

Create the test database once:

```bash
docker exec dso-postgres createdb -U postgres dso_test
```

Run the database integration tests:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso \
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso_test \
npm --workspace @repo/db test
```

## 8. Validate the Seed Fixture

```bash
npm --workspace @repo/contracts run check-types
npm --workspace @repo/contracts run check-fixtures
```

## Complete Reset-and-Run Workflow

```bash
docker start dso-postgres

docker exec dso-postgres dropdb -U postgres --if-exists dso
docker exec dso-postgres createdb -U postgres dso

DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso \
DSO_SEED_USER_PASSWORD='<choose-a-dev-password>' \
npm run db:seed

docker exec dso-postgres \
  psql -U postgres -d dso \
  -c 'SELECT id, slug, name FROM projects;'

# Update DSO_WORKBENCH_PROJECT_ID in apps/workbench/.env.local

npm run dev
```

Update `DSO_WORKBENCH_PROJECT_ID` after every reseed because
[`fixtureIds`](../../packages/contracts/fixtures/ids.ts) generates fresh UUIDs.
