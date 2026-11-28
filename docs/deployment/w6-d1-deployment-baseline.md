# W6 D1: Deployment and Hardening Baseline

## Status

This document records only verified facts or explicit decisions made for W6 Day 1. Secret values and database connection strings are not stored in this repository.

## Verified Infrastructure

- A Vercel account is authenticated through the Vercel CLI.
- The `dso` Vercel project has been created in the `jin-personal-proj` team.
- This repository is linked to the `dso` Vercel project through the Vercel CLI.
- The `dso` Vercel project is connected to the `JinKim1011/dso` GitHub repository.
- No application deployment or environment-variable setup has been completed yet.
- A Neon project named `DSO` has been created.
- Project ID: `restless-river-76833249`
- Region: `AWS Europe Central 1 (Frankfurt)`
- The project has a default `production` branch.
- Branch ID: `br-jolly-cake-bhdqfybh`
- The project currently contains one default PostgreSQL database and one compute.
- Neon reports 6-hour history retention. This is not recorded as a configured backup.

## Architecture

```text
Client
  -> Vercel-managed HTTPS
  -> Workbench Next.js runtime
  -> pooled Neon PostgreSQL connection

Migration operator or future migration CI
  -> direct Neon PostgreSQL connection
  -> schema migration
```

- Runtime traffic uses the pooled Neon connection.
- Schema migrations use the direct Neon connection.
- Runtime and migration credentials should be separate database roles.
- The application must not receive migration credentials.
- Migration credentials must not be bundled into application environment variables.

## Environment Variables

### Runtime

| Variable                          | Required            | Purpose                                               |
| --------------------------------- | ------------------- | ----------------------------------------------------- |
| `DATABASE_URL`                    | Yes                 | Pooled Neon PostgreSQL connection for runtime queries |
| `DB_POOL_MAX`                     | No                  | Runtime pool size; code default is `10`               |
| `NODE_ENV`                        | Platform-set        | Environment mode                                      |
| `SESSION_COOKIE_NAME`             | No                  | Session cookie name; code default is `dso_session`    |
| `DSO_WORKBENCH_ORIGIN`            | Yes                 | Exact HTTPS origin trusted for mutation requests      |
| `DSO_WORKBENCH_PROJECT_ID`        | Deployment-specific | Project loaded by the Workbench UI                    |
| `DSO_RELEASE_SIGNING_KEY_ID`      | For publishing      | Ed25519 signing-key identifier                        |
| `DSO_RELEASE_SIGNING_PRIVATE_KEY` | For publishing      | Ed25519 PKCS#8 private key                            |

### Migration and seed administration

| Variable                 | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `DIRECT_DATABASE_URL`    | Direct Neon connection used for migrations       |
| `DSO_SEED_USER_PASSWORD` | Password used only to derive seed account hashes |

`npm run db:migrate` loads `DIRECT_DATABASE_URL` and applies migrations without seed execution. The combined development seed script still loads `DATABASE_URL`; do not use that script with the runtime pooled URL.

### CLI clients

| Variable                 | Purpose                                |
| ------------------------ | -------------------------------------- |
| `DSO_API_URL`            | Workbench release API base URL         |
| `DSO_API_KEY`            | Project-scoped CLI credential          |
| `DSO_RELEASE_TRUST_FILE` | Optional local Ed25519 trust-file path |

Test-only variables:

| Variable            | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `TEST_DATABASE_URL` | Separate PostgreSQL database for integration tests |

## Secret Management

The following values are secrets and must never be committed or added to Markdown:

- Neon runtime password or runtime URL
- Neon direct/migration password or migration URL
- `DSO_SEED_USER_PASSWORD`
- `DSO_RELEASE_SIGNING_PRIVATE_KEY`
- `DSO_API_KEY`

Approved secret placement:

- Vercel environment variables store runtime secrets.
- Release signing key ID and private key are managed as Vercel environment variables.
- The migration operator stores direct credentials separately and does not copy them into Vercel runtime variables.
- Seed passwords are used only during an administrator-run seed operation and are then discarded.
- CLI API keys remain on the CLI user's local machine.

No separate secret manager is adopted for W6 D1. This must be revisited if key governance or secret rotation requires it.

## Preview and Production Strategy

Decision:

- Preview deployments are enabled.
- Preview deployments use a separate Neon branch or database.
- Preview must not share Production data.
- Production uses the `production` Neon branch.

Rationale:

- Preview deployments must not mutate or expose Production releases, sessions, API keys, or seed data.
- Neon branching provides database isolation without introducing a second application database into the repository.

Before deployment setup is complete, both the Preview and Production environments must have explicit database URLs. The Vercel project does not currently contain these values.

## Migration Strategy

Decision:

- Migration is initially run locally by an authorized operator.
- A future migration CI job may run migrations with `DIRECT_DATABASE_URL`.
- The application runtime uses a pooled URL and never runs migrations at request time.

The migration scripts use a PostgreSQL advisory lock and migration history table. Before running migrations against Neon, use a direct connection that belongs to the migration role.

## Signing Key Placement

Decision:

- `DSO_RELEASE_SIGNING_KEY_ID` is a Vercel environment variable.
- `DSO_RELEASE_SIGNING_PRIVATE_KEY` is a Vercel secret-style environment variable.
- Key ID and private key are set only in the Production scope unless a separate Preview signing key is intentionally created.

The public key is not a deployment secret. CLI clients receive public trust from their local trust file rather than from the release response.

## Backup Status

- Neon project creation is complete.
- Neon reports 6-hour history retention on the Production branch.
- Long-term or on-demand backup activation is not yet confirmed.
- Backup configuration and restore verification remain follow-up items.

## Domain

Decision:

- The first deployment uses the Vercel default domain.
- A custom domain is deferred until deployment and HTTPS behavior are verified.
- `DSO_WORKBENCH_ORIGIN` must exactly match the final HTTPS origin.

## CSP and Production Login Status

Current implementation:

- Security headers are configured for every route.
- `Content-Security-Policy-Report-Only` is currently used.
- CSP enforcement is not enabled.
- HSTS is enabled only when `NODE_ENV=production`.
- Login, logout, publish, API-key creation, and API-key revocation return 404 unless
  `NODE_ENV=development`.
- Session cookies use `Secure` only in Production mode.

Therefore:

- Production login is not currently enabled.
- Production publishing and API-key management are not currently enabled.
- Preview also cannot use these routes unless the code gate is intentionally changed.
- CSP and production enablement are W6 implementation and verification work, not D1 deployment configuration alone.

## Approved Decisions

1. Preview deployments: enabled.
2. Preview database: separate Neon branch or database.
3. Migration execution: local now, migration CI later.
4. Domain: Vercel default domain first.
5. Signing key: Vercel environment variables.
6. Database credentials: separate migration and runtime roles.

## Open Decisions

| Item                                          | Owner                  | Target                            |
| --------------------------------------------- | ---------------------- | --------------------------------- |
| Vercel Production environment variable values | Project operator       | Before first deploy               |
| Preview environment variable values           | Project operator       | Before Preview use                |
| Neon runtime and migration role creation      | Database administrator | Before migration                  |
| Preview branch creation                       | Database administrator | Before Preview deployment         |
| Backup policy and paid plan requirements      | Project operator       | Before production data is created |
| CSP enforcement                               | Implementation owner   | W6 hardening day                  |
| Production login/publishing enablement        | Implementation owner   | W6 hardening day                  |
| Custom domain                                 | Project operator       | Optional follow-up                |

## Completed Today

- Confirmed Vercel account access.
- Created and linked the Vercel `dso` project.
- Created the Neon `DSO` project.
- Confirmed the Production branch and default database.
- Reviewed runtime and migration credential separation.
- Reviewed CSP report-only status.
- Reviewed Production login and mutation route gates.
- Recorded environment variables and secret placement.
- Recorded Preview/Production, migration, domain, backup, and signing decisions.

## Deferred to Later W6 Days

- Add Neon pooled and direct URLs to Vercel environments.
- Create migration and runtime database roles.
- Create a separate Preview Neon branch.
- Configure backups and restore verification.
- Enable and verify CSP enforcement.
- Enable production login, publishing, and API-key management.
- Create Vercel Preview/Production environment variables.
- Perform migrations and seed against the empty database.
