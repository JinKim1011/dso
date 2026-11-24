# Threat model

This document identifies DSO's security boundaries, assets, threats, and required failure behavior. For controls and verification evidence, see [implemented security measures](./implemented-security-measures.md).

## Scope

This model covers the browser-to-Workbench path, PostgreSQL access, published-release delivery, and CLI generation into a consumer repository. Hosting-provider security, physical security, external TLS certificate issuance, production network configuration, backups, monitoring, and incident response remain deployment or operational responsibilities.

## Actors

- Project editors: modify project resources.
- Project publishers: save and publish releases.
- Project administrators: manage project API keys.
- Database administrators: hold infrastructure-level access.
- CLI users: download authorized published releases.
- Attackers: attempt credential theft, unauthorized access, data modification, or unsafe local writes.

## Assets

- Unpublished and published design-system data
- Password hashes and database-backed sessions
- API-key secrets and hashes
- Database credentials
- Release snapshots and signatures
- Private signing keys and independent CLI trust keys
- Generated local files and consumer repository content

DSO owns validation, signature verification, deterministic generation, and safe writes to its generated artifacts. The consumer owns repository access control, review, backup, and operational handling.

## Entry points and trust boundaries

| Entry point              | Trust boundary                 | Primary concern                                                 |
| ------------------------ | ------------------------------ | --------------------------------------------------------------- |
| Browser request          | Browser -> Workbench API       | Input authenticity, session security, authorization, CSRF, XSS  |
| Database query           | Workbench API -> PostgreSQL    | SQL injection, isolation, partial writes, sensitive errors      |
| Release download         | PostgreSQL -> API -> CLI       | Data completeness, project scope, signature integrity           |
| Local generation         | CLI -> consumer repository     | Path traversal, overwrite, partial replacement, shell execution |
| Credential configuration | Operator -> process -> runtime | Secret leakage, invalid trust configuration, key lifecycle      |

Data received across any boundary is untrusted until it has passed the relevant validation and authorization checks.

## Threats by data flow

### Browser -> Workbench API

Staged token saving and release publication are one authenticated operation. There is no standalone save endpoint.

```text
Browser
  -> Workbench API
     - session cookie
     - CSRF metadata
     - project and resource changes
```

Main threats:

- CSRF
- Broken project or role authorization
- Session theft or misuse
- Malformed input
- Script execution through browser-rendered content
- Credential or stack-trace disclosure

Required failure behavior:

- Reject unauthenticated, unauthorized, invalid-origin, malformed, or oversized requests.
- Do not persist partial staged changes.
- Return stable client errors and generic unexpected errors.
- Record an operational correlation ID without exposing credentials or internal details.
- Require HTTPS in deployment and fail closed when security configuration is invalid.

The audit trail must provide accountability for important actions, but audit records must not contain passwords, entered emails, session IDs, API-key secrets or hashes, token names, token values, or signing keys.

### Workbench API -> PostgreSQL

```text
Workbench API
  -> parameterized repository query
     - user context
     - project identifier
     - resource change
  -> PostgreSQL
```

Main threats:

- SQL injection
- Cross-project data access
- Invalid token hierarchies or references
- Concurrent staged-write conflicts
- Partial updates
- Database credential or query disclosure
- Excessive resource use

Required failure behavior:

- Reject project access before protected data is read or changed.
- Validate the complete proposed state before persistence.
- Roll back all changes when any write or audit step fails.
- Map constraint failures without exposing SQL or schema details.
- Apply request and query limits where practical.
- Log unexpected failures with sensitive values redacted.

### PostgreSQL -> Published-release API

```text
PostgreSQL
  -> published release snapshot
  -> canonicalization
  -> Ed25519 signature
  -> API response
```

Main threats:

- Draft or unpublished data is exposed.
- A release from another project is returned.
- A partial or inconsistent snapshot is signed.
- Sensitive storage fields enter the public payload.
- Malformed database content causes unsafe consumer behavior.
- Oversized release data exhausts memory or response capacity.
- Database errors reveal infrastructure details.

Required failure behavior:

- Return a safe not-found response for missing, unpublished, or inaccessible releases.
- Assemble the response from one valid immutable snapshot.
- Validate the unsigned release contract before signing it.
- Exclude passwords, API-key hashes, and signing material from the response.
- Reject payloads above configured limits.
- Return a generic server error without database details.

### CLI -> Published-release API

```text
CLI
  -> project-scoped Bearer API key
  -> Published-release API
  -> signed release envelope
```

Main threats:

- Stolen, expired, revoked, or incorrectly scoped API keys
- Release tampering
- Replay or stale-release acceptance
- Unknown signing keys
- Redirect-based credential leakage
- Malformed, oversized, or slow responses
- Trust replacement through the same compromised channel as the release

Required failure behavior:

- Reject missing or invalid credentials and preserve release-not-found semantics.
- Require HTTPS outside local development.
- Reject redirects, malformed JSON, invalid UTF-8, wrong content types, and oversized responses.
- Abort on timeout or network failure without exposing credentials.
- Verify the signature against independently distributed trust keys before using the release.
- Do not replace cache or generated files after a rejected response.

### CLI -> Local repository

```text
CLI
  -> local cache
  -> bounded read and signature re-verification
  -> pure token resolution and rendering
  -> tokens.json and tokens.css
  -> consumer repository
```

Main threats:

- Path traversal or symlink misuse
- Arbitrary overwrite
- Shell-command injection
- Malicious token values
- Partial replacement
- Secret leakage into generated files
- Modification of unrelated repository files

Required failure behavior:

- Restrict owned artifacts to `tokens.json` and `tokens.css` below the approved output root.
- Stop before writing when path or release validation fails.
- Never interpret release data as shell input.
- Re-read and verify the release for every generation because prior pull verification is not durable trust.
- Stage both outputs, back up existing owned files, and restore them if either installation fails.
- Require explicit confirmation or `--force` for replacement.
- Fail safely on permission, disk, and repository errors.

Component document paths remain persisted release data, but component Markdown generation is outside the current generation boundary.

## Secret handling

Passwords, API-key secrets, database credentials, session identifiers, authorization headers, and private signing keys must not appear in source control, API responses, generated files, or routine logs.

## Verification gaps

The following require implementation completion or deployment evidence:

- Production login, mutation, API-key, and release-download rate limits
- Quotas, timeouts, and monitoring for oversized requests, expensive validation, and database contention
- Enforced Content Security Policy and CSP reporting
- Deployed HTTPS and certificate verification
- Production PostgreSQL network isolation and least-privilege roles
- Dependency and secret scanning
- Backup and restore procedures
- Log-redaction verification in deployed operation
- Security monitoring and incident-response procedures

Implemented controls and available code or test evidence are maintained in [implemented security measures](./implemented-security-measures.md).
