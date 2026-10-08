# Published Release API Contract

What complete, stable snapshot does a CLI need in order
to generate local resources?

## Purpose

A published release is the versioned snapshot that the workbench makes
available to the CLI. The response must represent:

- token definitions
- token-type hierarchy
- token references
- registered components
- component document templates
- release metadata

## Endpoint

```text
GET /api/releases/:releaseId
```

The response is consumed by different clients:

```text
Published release API response
        |
        +--> CLI cache -> generator -> local files
        |
        +--> Workbench adapter -> TokenGraphViewModel -> Workbench UI
```

## Authentication

The endpoint accepts either:

- an authenticated workbench session for authorized project members; or
- a project-scoped CLI API key with the `release:read` scope.

The CLI uses the API-key flow and never connects directly to PostgreSQL. The
API checks that the release exists, belongs to the project associated with the
credential, and has `status: "published"` before returning it. Unpublished
releases are not downloadable.

The CLI sends the key using:

```http
Authorization: Bearer <api-key>
```

## Success response

Show one realistic JSON example.

```json
{
  "schemaVersion": 1,
  "release": {
    "id": "release_001",
    "projectId": "project_001",
    "version": "1.0.0",
    "status": "published",
    "publishedAt": "2026-10-08T09:00:00Z"
  },
  "tokenTypes": [
    {
      "id": "type_color_base",
      "projectId": "project_001",
      "category": "color",
      "name": "Base",
      "kind": "primitive",
      "parentTypeId": null
    },
    {
      "id": "type_color_surface",
      "projectId": "project_001",
      "category": "color",
      "name": "Surface",
      "kind": "semantic",
      "parentTypeId": null
    },
    {
      "id": "type_color_surface_interactive",
      "projectId": "project_001",
      "category": "color",
      "name": "Interactive",
      "kind": "semantic",
      "parentTypeId": "type_color_surface"
    }
  ],
  "tokens": [
    {
      "id": "token_color_base_neutral_0",
      "projectId": "project_001",
      "tokenTypeId": "type_color_base",
      "name": "neutral-0",
      "cssVar": "--base-neutral-0",
      "value": {
        "kind": "scalar",
        "value": "oklch(98.5% 0 0)"
      }
    },
    {
      "id": "token_color_base_neutral_50",
      "projectId": "project_001",
      "tokenTypeId": "type_color_base",
      "name": "neutral-50",
      "cssVar": "--base-neutral-50",
      "value": {
        "kind": "scalar",
        "value": "oklch(97% 0 0)"
      }
    },
    {
      "id": "token_color_base_neutral_850",
      "projectId": "project_001",
      "tokenTypeId": "type_color_base",
      "name": "neutral-850",
      "cssVar": "--base-neutral-850",
      "value": {
        "kind": "scalar",
        "value": "oklch(20.5% 0 0)"
      }
    },
    {
      "id": "token_color_base_neutral_900",
      "projectId": "project_001",
      "tokenTypeId": "type_color_base",
      "name": "neutral-900",
      "cssVar": "--base-neutral-900",
      "value": {
        "kind": "scalar",
        "value": "oklch(14.5% 0 0)"
      }
    },
    {
      "id": "token_color_surface_default",
      "projectId": "project_001",
      "tokenTypeId": "type_color_surface",
      "name": "default",
      "cssVar": "--surface-default",
      "value": {
        "kind": "modes",
        "light": "var(--base-neutral-0)",
        "dark": "var(--base-neutral-900)"
      }
    },
    {
      "id": "token_color_surface_muted",
      "projectId": "project_001",
      "tokenTypeId": "type_color_surface",
      "name": "muted",
      "cssVar": "--surface-muted",
      "value": {
        "kind": "modes",
        "light": "var(--base-neutral-50)",
        "dark": "var(--base-neutral-850)"
      }
    },
    {
      "id": "token_color_surface_interactive_hoverWeak",
      "projectId": "project_001",
      "tokenTypeId": "type_color_surface_interactive",
      "name": "hoverWeak",
      "cssVar": "--surface-interactive-hoverWeak",
      "value": {
        "kind": "modes",
        "light": "var(--base-neutral-50)",
        "dark": "var(--base-neutral-850)"
      }
    }
  ],
  "tokenReferences": [
    {
      "referencingTokenId": "token_color_surface_default",
      "referencedTokenId": "token_color_base_neutral_0",
      "mode": "light"
    },
    {
      "referencingTokenId": "token_color_surface_default",
      "referencedTokenId": "token_color_base_neutral_900",
      "mode": "dark"
    },
    {
      "referencingTokenId": "token_color_surface_muted",
      "referencedTokenId": "token_color_base_neutral_50",
      "mode": "light"
    },
    {
      "referencingTokenId": "token_color_surface_muted",
      "referencedTokenId": "token_color_base_neutral_850",
      "mode": "dark"
    },
    {
      "referencingTokenId": "token_color_surface_interactive_hoverWeak",
      "referencedTokenId": "token_color_base_neutral_50",
      "mode": "light"
    },
    {
      "referencingTokenId": "token_color_surface_interactive_hoverWeak",
      "referencedTokenId": "token_color_base_neutral_850",
      "mode": "dark"
    }
  ],
  "components": [
    {
      "id": "component_button",
      "projectId": "project_001",
      "name": "Button",
      "slug": "button",
      "description": "An interactive control for submitting an action or navigating to another destination.",
      "documentPath": "components/button.md"
    },
    {
      "id": "component_modal",
      "projectId": "project_001",
      "name": "Modal",
      "slug": "modal",
      "description": "A dialog surface for focused tasks.",
      "documentPath": "patterns/overlays/modal.md"
    }
  ],
  "documentTemplates": [
    {
      "id": "template_button",
      "projectId": "project_001",
      "componentId": "component_button",
      "name": "Button documentation",
      "format": "markdown",
      "content": "# Button\n\n## Purpose\n\n{{description}}\n\n## Usage\n\nUse Button for an action that requires an explicit user interaction.\n\n## Variants\n\nDocument the supported Button variants here.\n\n## States\n\nDocument the supported Button states here.\n"
    },
    {
      "id": "template_modal",
      "projectId": "project_001",
      "componentId": "component_modal",
      "name": "Modal documentation",
      "format": "markdown",
      "content": "# Modal\n\n## Purpose\n\n{{description}}\n\n## Usage\n\nUse Modal for a focused task that requires the user's attention.\n\n## Anatomy\n\nDocument the Modal regions and slots here.\n\n## States\n\nDocument the supported Modal states here.\n"
    }
  ]
}
```

## Response fields

### `schemaVersion`

The version of the published-release response schema. It changes when the
meaning or structure of the response changes in a way that may require a
consumer update.

### `release`

Metadata for the immutable published snapshot:

- `id`: stable release identifier
- `projectId`: project that owns the release
- `version`: project-facing release version
- `status`: must be `"published"` in a successful response
- `publishedAt`: ISO 8601 timestamp for publication

The release metadata identifies the snapshot; it does not describe the current
mutable project state.

### `tokenTypes`

The token-type hierarchy. Each item contains:

- `id`: stable token-type identifier
- `projectId`: owning project
- `category`: value category such as `color`, `typography`, `spacing`, `radius`, `motion`, or `shadow`
- `name`: human-readable type name
- `kind`: `"primitive"` or `"semantic"`
- `parentTypeId`: parent type identifier, or `null` for a root type

### `tokens`

The token definitions in the release. Each token points to a token type through
`tokenTypeId`.

- `name` is the token name within its type.
- `cssVar` is the generated CSS custom-property name, when one exists.
- `value` uses the domain value union. Its `kind` is independent of the token
  type's `kind`.

For example, a primitive token can have a scalar value, and a semantic token
can have mode-specific values.

### `tokenReferences`

Token-to-token dependency edges. Each edge contains the referencing token,
referenced token, and the mode of the referencing value when the value is
mode-specific.

### `components`

Registered components included in the release. Each component contains its
portable `documentPath`, which is relative to the output root selected by the
CLI or consuming repository.

The path identifies the generated document location. It does not identify
component source files and does not claim that DSO has discovered token usage
from source code.

### `documentTemplates`

Per-component Markdown templates. Each template is linked to a component by
`componentId` and contains the content used by the generator.

The template content may use documented generator placeholders such as
`{{description}}`. The placeholder syntax and supported variables are part of
the generator contract and must be validated before publication.

## Resource relationships

The relationships are represented by IDs in normalized arrays for these reasons:

- They map naturally to relational tables.
- They avoid duplicating the same token type in many tokens.
- They support reverse-reference queries.
- The CLI and workbench can build their own indexes.
- The response remains close to a complete database-independent snapshot.

```json
{
  "tokenTypes": [],
  "tokens": [],
  "tokenReferences": [
    {
      "referencingTokenId": "",
      "referencedTokenId": "",
      "mode": "light"
    }
  ]
}
```

`tokenReferences` identifies the exact value mode when the referencing token has
mode-specific values. For example, the `light` value of
`token_color_surface_default` references `token_color_base_neutral_0`, while
the `dark` value references `token_color_base_neutral_900`.

The same referencing token, referenced token, and mode combination may appear
only once. A reference mode must be supported by the referencing token's value.
The API does not include a separate reverse-reference collection; consumers can
derive reverse dependencies by indexing `tokenReferences`.

Token types own the hierarchy and tokens point to their type through
`tokenTypeId`. Components and document templates are related by their
component/template identifiers and are included as separate normalized
collections.

Each component registration identifies the component. Each document template
identifies its component through `componentId` and contains the Markdown source
used by the generator. The template is a per-component document definition; it
does not contain source-code analysis or an inferred list of tokens used by the
component. `components[].documentPath` is a portable path relative to the
output root selected by the CLI or consuming repository. It must use `/`
separators and must not be absolute or contain `..` path segments.

## Excluded data

The response does not claim to contain automatic source-code analysis of which
components use which tokens. That analysis is outside the first-release scope.
It also does not contain an absolute or machine-specific output directory.
Legacy source manifest kinds such as `class-union` and `unknown` are not part of
the published domain contract; seed normalization will exclude or reject them.

## Errors

The endpoint returns JSON errors with a stable error code:

```json
{
  "error": {
    "code": "RELEASE_NOT_FOUND",
    "message": "Published release was not found."
  }
}
```

Expected cases:

| Status | Code                    | Meaning                                                                   |
| ------ | ----------------------- | ------------------------------------------------------------------------- |
| `401`  | `UNAUTHENTICATED`       | No session or API key was provided.                                       |
| `403`  | `FORBIDDEN`             | The credential cannot read the requested project or lacks `release:read`. |
| `404`  | `RELEASE_NOT_FOUND`     | The release does not exist or is not visible to the caller.               |
| `409`  | `RELEASE_NOT_PUBLISHED` | The release exists but is not downloadable.                               |
| `422`  | `RELEASE_INVALID`       | The stored release cannot satisfy the published contract.                 |
| `429`  | `RATE_LIMITED`          | The caller exceeded the release-download limit.                           |

The API must not expose whether an inaccessible release exists. Depending on
the authorization policy, an unauthorized release may therefore be returned as
`404` rather than `403`.

## Compatibility

- The workbench uses an adapter to convert the published release domain
  response into the existing `TokenGraphViewModel`; the two shapes are
  intentionally different.
- The API response's `value.kind` is part of the domain contract. The
  workbench view model may adapt mode values to its existing view-oriented
  shape.
- The CLI stores the downloaded response with its `schemaVersion` and must
  reject unsupported schema versions rather than silently guessing.
- Adding optional fields is backward-compatible. Removing fields, changing
  field meanings, or changing required value shapes requires a new schema
  version or an explicitly compatible migration.
- `documentPath` remains relative to the CLI-selected output root. A release
  must never encode an absolute machine-specific output directory.

## Open decisions

- Should `release.version` be semantic versioning or an arbitrary project version?
- Should projects be allowed to define additional mode names beyond `light` and `dark`?
- Should an unresolved token value be publishable, or should publication reject it?
- Which placeholder variables should the first generator contract support?
- Should one component have exactly one document template in the first release?
