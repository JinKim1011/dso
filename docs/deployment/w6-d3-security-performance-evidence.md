# W6 D3: Security Hardening and Performance Evidence

This document records the security and performance evidence gathered from the deployed Workbench and focused repository tests.

Find relevant reads in:

- [W6 D2 database and deployment verification](./w6-d2-deployment-verification.md) for the deployed environment.
- [Implemented security measures](../security/implemented-security-measures.md) for implemented controls.
- [Threat model](../security/threat-model.md) for threats and required failure behavior.

## Production Deployment Observations

Production URL: `https://dso-jin-personal-proj.vercel.app`

The deployed Workbench returned:

- HTTPS with status 200 for `/login`
- HSTS with `max-age=31536000`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- A `Permissions-Policy`
- A report-only CSP header

## CSP Decision

CSP remains in report-only mode for W6 D3.

Browser observation on `/login` found nine report-only violations from Next.js inline scripts. The violations did not block execution because the policy is report-only. Enforcing the current policy would block those scripts.

Three options were considered:

1. Enforce with `script-src 'unsafe-inline'`.
2. Implement a nonce-based CSP.
3. Keep report-only until nonce-based CSP is implemented.

Option 3 is approved. `unsafe-inline` would weaken the inline-script protection the policy is intended to provide. Nonce-based CSP requires coordinated middleware, request nonce propagation, and full browser regression coverage and is deferred to a separate hardening task.

A CSP reporting endpoint is not implemented. The current collector, storage, abuse controls, and retention policy do not exist, so console and browser evidence is used instead.

## Rate Limiting

Three intentionally invalid Production login attempts each returned 401. No `429`, `Retry-After`, or rate-limit headers were observed.

Current state:

- Login rate limiting is not implemented.
- Publish, API-key create/revoke, and release-download rate limiting are not implemented.
- Production publish and API-key mutation routes remain development-gated.
- Release download is available through its authenticated boundary but does not currently enforce request throttling.

Recommended follow-up priority:

1. Login, keyed by source address and normalized email.
2. Publish and API-key create/revoke before enabling those routes in Production.
3. Release download, keyed by API-key identifier or project.

## Request and Error Handling

Production probes confirmed:

- Cross-origin login mutation: 403 `request-rejected`
- Request body over 1,000,000 bytes: 413 `body-too-large`

Focused Workbench tests passed:

- 42 generic-error, login, and publish boundary tests
- Expected 500 responses are generic and include a unique correlation ID.
- Sensitive exception messages, credentials, key hashes, session values, and query details are omitted from response bodies and logs.

## Security Test Evidence

The following focused suites passed:

| Area                                                 | Result                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Release download and API-key application integration | 21 passed                                                                       |
| SQL injection and database constraints               | 23 passed                                                                       |
| Cross-project staged-write protection                | 16 passed                                                                       |
| Release signing and envelope protocol                | 33 passed                                                                       |
| Release route boundary tests                         | 12 passed, 5 database integration tests skipped without route-suite environment |
| Generated JSON/CSS secret exclusion                  | 15 passed                                                                       |

Covered behaviors include:

- Unpublished and inaccessible release denial
- Expired and revoked API-key denial
- Wrong-project and wrong-scope API-key denial
- Cross-project membership and write denial
- Modified payload and invalid signature denial
- Parameterized repository behavior for SQL input
- Secret exclusion from release responses, logs, and generated token artifacts

## Dependency Scan

Full `npm audit` found:

- 0 info
- 0 low
- 8 moderate
- 0 high
- 0 critical

The moderate findings are in development tooling paths involving `glob`, `minimatch`, and `typescript-eslint`. The suggested forced fix includes breaking major upgrades and is deferred to a dependency-update task rather than applied during D3 evidence collection.

`npm audit --omit=dev` reported:

- 0 runtime vulnerabilities

## Secret Scan

A tracked-tree scan found no Production connection strings, private signing keys, CLI keys, GitHub tokens, or cookie values.

Seven candidates were reviewed and approved as expected documentation examples:

- Local Docker PostgreSQL localhost URLs
- A placeholder private-key example containing no key material

Build and runtime log pattern scans also found no connection strings, private-key blocks, cookie values, authorization values, or explicit secret assignments.

## Performance Queries

All query evidence was collected against the Neon Production branch at the D2 seed scale:

- 44 token types
- 196 tokens

### Token types by project

Optimizer plan:

- `Seq Scan` on `token_types`
- 44 rows
- Execution time: 0.062 ms

Forced-index comparison:

- Index scan using `token_types_project_and_id_unique`
- Execution time: 1.071 ms

The sequential scan is the correct planner choice at this table size. The index exists; this is not a missing-index problem.

### Token references by project

- `Seq Scan` on `token_references`
- Execution time: 1.436 ms

At the current table size, the optimizer favored the sequential scan over an indexed access path.

### Reverse references

- `Seq Scan` on `token_references`
- Execution time: 0.053 ms

The `referenced_token_id` index exists. The current low-row result is cheaper to read sequentially.

### Hierarchy

- Recursive CTE completed three inner loops.
- 44 hierarchy rows
- `Seq Scan` plus hash join
- Execution time: 0.742 ms

### Project/release lookup

- `Index Scan` on the release primary key
- Execution time: 0.848 ms

### Published releases by project

- Indexed project access
- Execution time: 0.053 ms

### Complete release snapshot

- `Index Scan` on `release_snapshots_pkey`
- Execution time: 0.025 ms

## Index and Read-Replica Decisions

No additional index is approved in D3.

The observed sequential scans occur on small tables and are faster than forced indexed access. Adding indexes now would increase write cost and storage without measured read benefit.

No read replica is approved. Current representative queries complete below 1.5 ms in the database, and the Workbench primarily performs low-volume transactional and project-scoped reads.

## Connection Pool

Approved D2/D3 settings remain:

- Runtime URL: Neon pooled connection
- `DB_POOL_MAX=5`
- Idle timeout: 30 seconds
- Connection timeout: 5 seconds
- One module-level pool reused within each Vercel runtime instance

No `attachDatabasePool` integration is added. The current pool lifecycle already reuses one pool per runtime module instance and does not introduce request-scoped pool creation.

Neon Monitoring displayed “Some metrics are unavailable” for PostgreSQL connection count. Therefore, quantitative concurrent-connection behavior is not claimed. Connection or pool exhaustion errors were not observed in the available Vercel runtime logs.

## Remaining Risks and Ownership

### Closed-beta account operations

The service has no self-service signup, invitation-link, first-login password setup, or password-reset flow. Closed-beta users must therefore be provisioned manually by the operator.

The preferred operating model is one user per person and a least-privilege `project_members` role:

- `editor` for read and draft editing
- `publisher` for publishing
- `admin` for API-key creation and revocation

The operator generates a random temporary password, hashes it with Argon2id locally, stores only the hash in `users`, assigns the required project membership, and sends credentials through a password manager or separated secure channels. Shared seed accounts should be retained for development and verification rather than used as routine individual accounts.

This operating model has explicit limitations: a user cannot set or rotate their password in the application, invitations do not expire, and account recovery requires operator action. Invitation links and first-login password setup are therefore open product work for a later stage; production credentials should be rotated or revoked when the closed beta ends.

### Project provisioning

The current Workbench has project read and membership behavior but no authenticated project-creation UI or API. If a beta user only needs access to an existing project, the operator assigns a `project_members` row and does not need to create another project. If users need isolated projects, the operator must create each project and its project data manually; the product does not yet provide self-service project creation.

The deployment also selects one configured Workbench project through `DSO_WORKBENCH_PROJECT_ID`. The `/projects` page can list accessible projects, but token pages load the configured project. Multi-project switching is therefore present only as partial groundwork and is not a complete operator-created project experience.

| Item                                    | State                                      | Owner                    |
| --------------------------------------- | ------------------------------------------ | ------------------------ |
| Enforced nonce-based CSP                | Deferred                                   | Workbench implementation |
| CSP violation collection                | Deferred                                   | Security and operations  |
| Login throttling                        | Open                                       | Workbench implementation |
| Publish/API-key throttling              | Required before Production enablement      | Workbench implementation |
| Release-download throttling             | Open                                       | API implementation       |
| Development-tool dependency updates     | 8 moderate advisories accepted temporarily | Maintainer               |
| Quantitative pool concurrency/load test | Blocked by unavailable Neon metric         | Performance owner        |
| Long-term backup policy                 | Open                                       | Project operator         |

## D3 Completion

Completed:

- CSP observation and policy decision
- Production CSRF and request-size verification
- Generic error and correlation-ID tests
- Release, API-key, SQL, authorization, signature, and artifact security tests
- Dependency and secret scans with exception review
- Required representative query plans
- Indexed versus sequential-plan comparison
- Pool and infrastructure decisions

Not yet completed:

- Rate-limit implementation
- Enforced nonce-based CSP
- CSP reporting endpoint
- Quantitative concurrent connection-load test
