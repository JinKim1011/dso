# Published Release API Contract

This document explains the `GET /api/releases/:releaseId` contract and the signed response consumed by the CLI.

Find relevant reads in:

- [ER model](./er-model.md) for the persisted release snapshot structure
- [migration verification](./migration-verification.md) for the implemented database result
- [workbench local development](./workbench-local-development.md) for PostgreSQL and workbench setup
- [threat model](../security/threat-model.md) for authentication and signing security boundaries.

## Endpoint

```text
GET /api/releases/:releaseId
```

The route accepts either a workbench session or a CLI API key. Only a release with `status: "published"` is returned. API-key access requires the `release:read` scope and an active key for the release's project.

The response is returned by both authentication paths and signed once at the HTTP boundary.

The publish request includes a `requestId`, and the durable `publish_requests` record is not part of the signed release response or the CLI download contract.

## Authentication

Workbench sessions require project membership. CLI clients send the combined credential as a bearer token:

```http
Authorization: Bearer dso_<keyIdentifier>_<secret>
```

The server verifies project scope and key validity, and returns `404` for an inaccessible release. Remote API URLs require HTTPS. Plain HTTP is allowed only for loopback hosts in development.

## Success response

```json
{
  "schemaVersion": 1,
  "release": {
    "id": "release_001",
    "projectId": "project_001",
    "version": "1",
    "status": "published",
    "createdAt": "2026-10-08T08:00:00Z",
    "publishedAt": "2026-10-08T09:00:00Z"
  },
  "tokenTypes": [],
  "tokens": [],
  "references": [],
  "components": [],
  "templates": [],
  "signature": {
    "algorithm": "Ed25519",
    "keyId": "release-key-2026-01",
    "value": "<base64url-signature>"
  }
}
```

## Response fields

### `schemaVersion`

The response schema version. Unsupported versions must be rejected by the consumer.

### `release`

The immutable snapshot metadata:
`id`, `projectId`, `version`, `status`, `createdAt`, and `publishedAt`. `version` is a project-scoped sequential string. `status` is always `"published"`.

### `signature`

`algorithm` is always `"Ed25519"`; `keyId` identifies the public key in the CLI trust file; `value` is a base64url signature.

The signature covers the canonical unsigned response. It excludes the `signature` object itself. The CLI must reject unknown key IDs, unsupported algorithms, modified payloads, and invalid signatures.

### `tokenTypes`

Each item contains `id`, `projectId`, `parentTypeId`, `category`, `name`, and `kind`. The kind is `"primitive"` or `"semantic"`. Typography primitive names are `font-size`, `font-weight`, and `line-height`.

### `tokens`

Each token contains `id`, `projectId`, `tokenTypeId`, `name`, `cssVar`, and `value`.
`value.kind` is one of `single`, `modes`, `typography`, or `unresolved`. The release contract does not include resolved reference values inside this union.

`cssVar` is retained as a legacy compatibility field. The token generator derives CSS custom-property names deterministically from the token type and token name.

Generator consumers must not depend on this legacy value. `dso generate` derives primitive and semantic names inside the generator and ignores stored `cssVar` values.

### `references`

Each normalized edge contains `referencingTokenId`, `referencedTokenId`, `projectId`, and `slot`.
Supported slots are `value`, `light`, `dark`, `fontSize`, `fontWeight`, and `lineHeight`. Color and shadow semantic tokens use `light` and `dark`; typography semantic tokens use `fontSize`, `fontWeight`, and `lineHeight`.

The same referencing token, referenced token, and slot combination is unique. The database also permits only one target per referencing token and slot.

### `components`

Registered components retained for compatibility contain `id`, `projectId`, `name`, `slug`, `description`, and `documentPath`.
`documentPath` is relative to the CLI-selected output root. It must use `/` separators and must not be absolute or contain `..` path segments.

The response does not infer component source usage or source-code relationships. Components and `documentPath` are retained for compatibility and are not consumed by token generation.

### `templates`

Per-component Markdown templates contain `id`, `projectId`, `componentId`, `name`, and `content`.
The first release supports Markdown template content only. Templates remain part of the signed snapshot, but first version does not render their content or process placeholders.

## Relationships

The response uses normalized arrays: `tokenTypeId` classifies tokens, `references` connect tokens, and `templates[].componentId` identifies their component. Consumers build lookup and reverse-reference indexes; the response does not include a reverse-reference collection.

## Errors

All route errors use a JSON error envelope:

```json
{
  "ok": false,
  "error": {
    "code": "resource-not-found",
    "message": "The published release was not found."
  }
}
```

| Status | Error code                   | Meaning                                         |
| ------ | ---------------------------- | ----------------------------------------------- |
| `400`  | `invalid-request`            | The release ID or request is invalid.           |
| `401`  | `invalid-api-key-credential` | The CLI credential is missing or invalid.       |
| `401`  | `authentication-required`    | Required session authentication is missing.     |
| `403`  | `project-access-denied`      | A session cannot access the project.            |
| `403`  | `api-key-scope-denied`       | The API key lacks `release:read`.               |
| `404`  | `resource-not-found`         | The release is missing, draft, or inaccessible. |
| `500`  | `internal-error`             | An unexpected server failure occurred.          |

Session and API-key paths must return the same unsigned application payload. Only the authentication and authorization step differs.

## Compatibility

- Adding optional fields is backward-compatible.
- Removing fields, changing field meanings, or changing required value shapes requires a new schema version.
- CLI clients must reject unsupported schema versions instead of guessing.
- A signed envelope is not authoritative for trust; the CLI verifies the signature against an independent local trust file.
- Component registrations and templates remain in the snapshot for forward compatibility. The first CLI generation scope consumes token types, tokens, and references only.

## Scope

The first release does not expose:

- automatic source-code component usage
- absolute or machine-specific output paths
- legacy `class-union` or `unknown` seed kinds
- component or template generation
