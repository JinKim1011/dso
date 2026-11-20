# Design System Oracle (DSO)

DSO is a database-backed workbench for authoring and publishing design-system resources. It stores token contracts, component registrations, token relationships, and Markdown templates in PostgreSQL.

The current release flow is:

1. Author and stage token changes in the Workbench.
2. Save and publish the changes as one atomic operation.
3. Store an immutable release snapshot.
4. Deliver a signed release through the HTTP API.
5. Verify and generate `tokens.json` and `tokens.css` with the CLI.

## Implemented use cases

- Authenticate Workbench users with database-backed sessions.
- Stage, save, and publish authorized token changes atomically.
- Store and serve immutable, signed release snapshots.
- Download project-scoped releases with expiring, revocable API keys.
- Verify release signatures and generate token artifacts with the CLI.

## Repository

```text
apps/
  workbench/     Web application and API
  cli/           Signed-release client and token generator
  docs/          Product and concept documentation

packages/
  application/   Authentication, authorization, and application services
  contracts/     Domain contracts and validation
  db/            PostgreSQL repositories, migrations, and seed helpers
  release-protocol/
                  Canonicalization, signing, parsing, and verification
  seed-data/     Development seed data
  ui/            Shared UI

database/
  migrations/    PostgreSQL schema migrations

docs/            Architecture, database, and security documentation
scripts/         Repository scripts
```

## Technology

- TypeScript, React, Next.js
- PostgreSQL and `pg`
- npm workspaces and Turborepo
- Vitest
- Argon2id for password hashing
- Ed25519 for published-release signatures

## Local development

### Prerequisites

- Node.js 18+
- npm 10.9.4+
- Docker

### Install

```bash
npm install
```

### Configure and run

The Workbench requires PostgreSQL, seeded data, and environment configuration. Follow [Workbench local development](./docs/database/workbench-local-development.md) for the complete setup.

```bash
npm run dev
```

The Workbench runs at `http://localhost:3000`. The documentation app runs at `http://localhost:3001`.

## Commands

```bash
npm run build
npm run lint
npm run check-types
npm run format
```

Run package tests through the relevant workspace, for example:

```bash
npm --workspace @repo/db test
npm --workspace @repo/application test
npm --workspace @repo/release-protocol test
npm --workspace @repo/cli test
npm --workspace workbench test
```

Database integration tests require separate development and test databases. See [migration verification](./docs/database/migration-verification.md).

## Documentation

- [Workbench local development](./docs/database/workbench-local-development.md)
- [ER model](./docs/database/er-model.md)
- [Migration verification](./docs/database/migration-verification.md)
- [Published release API contract](./docs/database/published-release-api.md)
- [Threat model](./docs/security/threat-model.md)
- [Implemented security measures](./docs/security/implemented-security-measures.md)

## Status

DSO is under active development. The core publish-to-CLI token flow is implemented, while production enablement, deployment configuration, and operational security controls remain in progress.
