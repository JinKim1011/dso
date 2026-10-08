# Published Release API Contract

## Purpose

A published release is the versioned snapshot tha the workbench makes avilable to the CLI. The response must represent the resources:

- toekn definitions
- token-type hierarchy
- token reference
- registred components
- component document templates
- release metadata

In the end it needs to answer to “What complete, stable snapshot does a CLI need in order to generate local resources?”

## Endpoint

```text
GET /api/releases/:releaseId
```

The flow is look like this

```text
Published release API response
        |
        v
Workbench adapter
        |
        v
TokenGraphViewModel
        |
        v
Workbench UI
```

## Authentication

Explain whether the endpoint requires a session, API key, or both.

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
    }
  ]
}
```

## Response fields

Describe each top-level field and its meaning.

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

Define not-found, unauthorized, and invalid-release behavior.

## Compatibility

- The workbench uses an adapter to convert the published release domain
  response into the existing `TokenGraphViewModel`; the two shapes are
  intentionally different.
- The API response's `value.kind` is part of the domain contract. The
  workbench view model may adapt mode values to its existing view-oriented
  shape.

## Open decisions

- Should `release.version` be semantic versioning or an arbitrary project version?
- Should component templates be keyed by component ID or template ID?
- Should token values preserve unresolved references or contain resolved values?
- Should `mode` be a closed set such as `light` and `dark`, or should projects
  be allowed to define additional mode names?
