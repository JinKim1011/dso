# Workbench local development

This guide prepares the local PostgreSQL database and starts the DSO workbench.

Find relevant reads in:

- [migration verification](./migration-verification.md) for database verification
- [published release API contract](./published-release-api.md) for the release download contract
- [threat model](../security/threat-model.md) for CSRF and signing security policy.

## Prerequisites

- Docker
- Node.js 18+
- npm 10.9.4+
- Run commands from the repository root

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

## 2. Reset and Seed the Development Database

The seed is not idempotent. Recreate the database before seeding:

```bash
docker exec dso-postgres dropdb -U postgres --if-exists dso
docker exec dso-postgres createdb -U postgres dso

DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso \
DSO_SEED_USER_PASSWORD='<choose-a-dev-password>' \
npm run db:seed
```

The seed creates `editor@example.test`, `publisher@example.test`, `admin@example.test`, and `nonmember@example.test`.

## 3. Configure the Workbench

Create `apps/workbench/.env.local`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dso
DB_POOL_MAX=10
DSO_WORKBENCH_PROJECT_ID=00000000-0000-4000-8000-000000000102
DSO_WORKBENCH_ORIGIN=http://localhost:3000
DSO_RELEASE_SIGNING_KEY_ID=release-key-2026-01
DSO_RELEASE_SIGNING_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

`DSO_WORKBENCH_PROJECT_ID` matches the fixed seed project ID. `DSO_WORKBENCH_ORIGIN` must be an origin without a path.

The signing private key must be an Ed25519 PKCS#8 PEM value. Represent newlines as `\n` in a one-line environment file. Never commit a real private key.

Generate a one-time key pair without writing it to the repository:

```bash
npm run signing:generate -- release-key-2026-11
```

The command prints a private-key environment value and separate public trust-file content for the supplied key ID. Treat the terminal output as secret and clear the terminal history afterward.

Verify a configured signing environment without printing either key:

```bash
DSO_RELEASE_SIGNING_KEY_ID='release-key-2026-11' \
DSO_RELEASE_SIGNING_PRIVATE_KEY='...' \
npm run signing:verify
```

## 4. Start the Workbench

Install workspace dependencies once after a clean checkout:

```bash
npm install
```

Start the full development workflow:

```bash
npm run dev
```

Open `http://localhost:3000` and log in with a seeded email and the password supplied to `DSO_SEED_USER_PASSWORD`.

Restart the development server after environment changes.

`@repo/release-protocol` exposes TypeScript source under the resolver's
`development` condition and JavaScript from `dist` under the default condition.
Next.js and Vitest therefore use the source implementation during Workbench
development and tests; a prior protocol build is not required after a clean
checkout. Production CLI and Workbench builds continue to use generated
JavaScript.

## Database Tests

Apply pending schema migrations without running the non-idempotent seed:

```bash
read -rsp 'Direct migration URL: ' DIRECT_DATABASE_URL
echo
export DIRECT_DATABASE_URL
npm run db:migrate
unset DIRECT_DATABASE_URL
```

Use a direct PostgreSQL URL for migration execution. Do not use the pooled runtime URL or the application `DATABASE_URL`.

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

Run the Workbench route tests without prebuilding the release-protocol package:

```bash
npm --workspace workbench test
```

The Turbo production build still builds workspace dependencies first:

```bash
npm run build --filter=workbench
```

Seed validation can be run separately:

```bash
npm --workspace @repo/contracts run check-types
npm --workspace @repo/contracts run check-fixtures
```
