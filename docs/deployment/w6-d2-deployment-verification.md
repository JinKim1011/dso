# W6 D2: Database and Deployment Verification

This document records the first verified Neon and Vercel deployment of the Workbench.

Find relevant reads in:

- [W6 D1 deployment baseline](./w6-d1-deployment-baseline.md) for approved architecture and credential-placement decisions.
- [Migration verification](../database/migration-verification.md) for schema verification methodology.
- [Workbench local development](../database/workbench-local-development.md) for local setup and seed commands.

## Deployment

- Production URL: `https://dso-jin-personal-proj.vercel.app`
- Platform: Vercel
- Git repository: `JinKim1011/dso`
- Production branch: `master`
- Latest verified Vercel environment: Production
- Latest verified deployment state: Ready
- Vercel-managed HTTPS is active.

The Vercel project uses the Next.js framework preset. Its build command is `npm run build -- --filter=workbench`, and its output directory is `apps/workbench/.next`.

## Neon Database

- Neon project: `DSO`
- Region: `AWS Europe Central 1 (Frankfurt)`
- Branch: `production`
- Database: one default PostgreSQL database
- PostgreSQL version: 18
- Runtime: `dso_runtime` over a pooled connection
- Migration: `dso_migration` over a direct connection
- The migration credential is not configured in Vercel.

## Migration and Seed Evidence

The seed script was run locally with a `dso_migration` direct connection. It applied migrations `001` through `008`, then inserted the seed in a transaction.

Verified schema state:

- 8 migration history rows
- 14 public tables
- 34 public indexes

Verified seed state:

- 4 users
- 1 project
- 3 project members
- 44 token types
- 196 tokens
- 1 release

The seeded project ID is `00000000-0000-4000-8000-000000000102`.

The seed is not idempotent. If `valid-seed.ts` is changed after a seed run, Production does not automatically update; a later reset/reseed requires an explicit rollback-safe data plan.

## Credential Separation Evidence

`dso_runtime` was verified with a pooled URL:

- `SELECT current_user` returned `dso_runtime`.
- User data was readable.
- `CREATE TABLE runtime_privilege_probe` was denied.

This confirms that the runtime credential can perform application data operations but cannot perform schema DDL.

`dso_migration` owns tables it creates and therefore can technically read or write those tables. This is a PostgreSQL ownership property, not an accidental grant that can be revoked from the table owner. The operational control is to keep this credential outside Vercel, never expose it to application code, and use it only for local migration administration.

Strict migration-credential exclusion from all DML remains outside the current migration architecture. Implementing that would require an additional migration execution design rather than only grants.

## Vercel Environment

Production currently uses:

| Variable | Scope or location | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Vercel Production | `dso_runtime` pooled Neon URL |
| `DB_POOL_MAX` | Vercel Production | Initial pool maximum of 5 |
| `DSO_WORKBENCH_PROJECT_ID` | Vercel Production | Seeded project loaded by the Workbench |
| `DSO_WORKBENCH_AUTH_ENABLED` | Vercel Production | Explicit Production login/logout enablement |
| `DSO_WORKBENCH_ORIGIN` | Vercel Production | Production HTTPS mutation origin |
| `DIRECT_DATABASE_URL` | Migration operator only | Planned explicit migration-script variable |
| `DSO_SEED_USER_PASSWORD` | Migration operator only | Seed password hashing input |

Actual URLs, passwords, private keys, and cookie values are not recorded in this document.

## Pooling

Approved initial settings:

- Maximum pool size: 5
- Idle timeout: 30 seconds
- Connection timeout: 5 seconds
- Pool reuse: module-level `getDatabasePool()` singleton within a Workbench runtime instance
- Runtime connection mode: Neon pooled connection

No `attachDatabasePool` abstraction is introduced for D2.

## HTTPS and Security Headers

The deployed `/login` response was verified over HTTPS:

- HTTP status: 200
- `Strict-Transport-Security: max-age=31536000`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy-Report-Only`: present

CSP enforcement is still open W6 work. The current deployment uses report-only mode.

## Session, Login, and Logout

Production authentication was verified:

- `admin@example.test` can log in with the seed password.
- Login creates a session and redirects into the Workbench.
- Logout deletes the active session and returns to login.
- A logged-out request to a protected page redirects to login.

The `dso_session` cookie was verified in browser DevTools:

- `HttpOnly`: set
- `Secure`: set
- `SameSite`: `Lax`
- `Path`: `/`

Preview authentication remains disabled unless a separate Preview decision explicitly enables it.

## Deployment Diagnosis and Log Review

The first Vercel build failures were resolved:

1. Turborepo did not pass required environment variables to the Workbench build.
2. Vercel used the `Other` framework preset and expected a `public` output directory.
3. The initially stored runtime URL produced `ENOTFOUND`.

After passing build variables, setting the Next.js preset and `apps/workbench/.next`, and replacing `DATABASE_URL` with the selected `dso_runtime` pooled URL, the login API returned the expected `401 invalid-credentials` result for an intentionally invalid password.

Build and runtime logs were scanned for connection strings, private-key markers, cookie values, authorization values, and explicit password values. No matching secret patterns were found. The error logging retains a correlation ID and safe error code without logging sensitive messages.

## Backup

- Neon history retention: 6 hours
- Restore UI is available for point-in-time recovery.
- No actual restore or data-destructive recovery was executed.
- A longer retention policy or external backup is not enabled on the current Free plan.

## Deferred or Open

- Create a separate Neon Preview branch and Preview database variables.
- Support `DIRECT_DATABASE_URL` explicitly in the migration and seed scripts.
- Decide whether changed seed data requires a controlled reset/reseed.
- Enforce CSP instead of report-only mode.
- Choose a longer-term backup policy before persistent production data requires more than 6-hour recovery.
- Enable Production publishing, release signing, and API-key management only after their separate security verification.
- Re-run connection and browser verification after any rotation of Neon credentials.
