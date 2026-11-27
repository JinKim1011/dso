# DSO ER model

This document defines the database structure: entities, keys, and relationships.

Find relevant reads in:

- [migration verification](./migration-verification.md) for the implemented result
- [published release API contract](./published-release-api.md) for the database snapshot exposed to clients
- [workbench local development](./workbench-local-development.md) for PostgreSQL and workbench setup
- [implemented security measures](../security/implemented-security-measures.md#audit-events) for implemented security-event rules.

## ERD

```mermaid
erDiagram
    PROJECTS ||--o{ RELEASES : owns
    PROJECTS ||--o{ PUBLISH_REQUESTS : scopes
    PROJECTS ||--o{ TOKEN_TYPES : owns
    PROJECTS ||--o{ TOKENS : owns
    PROJECTS ||--o{ COMPONENTS : owns
    PROJECTS ||--o{ DOCUMENT_TEMPLATES : owns
    PROJECTS ||--o{ PROJECT_MEMBERS : has
    PROJECTS ||--o{ API_KEYS : scopes
    PROJECTS o|--o{ AUDIT_EVENTS : contains
    RELEASES ||--o| RELEASE_SNAPSHOTS : snapshots
    RELEASES ||--o| PUBLISH_REQUESTS : created_by

    TOKEN_TYPES o|--o{ TOKEN_TYPES : parent_of
    TOKEN_TYPES ||--o{ TOKENS : classifies

    TOKENS ||--o{ TOKEN_REFERENCES : referencing_token
    TOKENS ||--o{ TOKEN_REFERENCES : referenced_token

    COMPONENTS ||--o{ DOCUMENT_TEMPLATES : has
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ PROJECT_MEMBERS : joins
    USERS o|--o{ AUDIT_EVENTS : performs
    USERS ||--o{ PUBLISH_REQUESTS : submits

    PROJECTS {
        uuid id PK
        text name
        text slug UK
    }

    USERS {
        uuid id PK
        text email UK
        text password_hash
        timestamp created_at
    }

    RELEASES {
        uuid id PK
        uuid project_id FK
        text version
        text status
        timestamp published_at
    }

    RELEASE_SNAPSHOTS {
        uuid release_id PK, FK
        jsonb token_types
        jsonb tokens
        jsonb reference_data
        jsonb components
        jsonb templates
        timestamp created_at
    }

    PUBLISH_REQUESTS {
        uuid project_id PK, FK
        uuid user_id PK, FK
        uuid request_id PK
        text request_hash
        uuid release_id FK
        jsonb response_data
        timestamp created_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        timestamp created_at
        timestamp expires_at
    }

    PROJECT_MEMBERS {
        uuid project_id PK, FK
        uuid user_id PK, FK
        text role
        timestamp created_at
    }

    API_KEYS {
        uuid id PK
        uuid project_id FK
        text key_identifier UK
        text key_hash
        text scope
        timestamp expires_at
        timestamp revoked_at
        timestamp created_at
    }

    AUDIT_EVENTS {
        uuid id PK
        uuid user_id FK
        uuid project_id FK
        text action
        text resource_type
        uuid resource_id
        jsonb metadata
        timestamp created_at
    }

    TOKEN_TYPES {
        uuid id PK
        uuid project_id FK
        uuid parent_type_id FK
        text name
        text category
        text kind
    }

    TOKENS {
        uuid id PK
        uuid project_id FK
        uuid token_type_id FK
        text name
        text css_var
        jsonb value
    }

    TOKEN_REFERENCES {
        uuid referencing_token_id PK, FK
        uuid referenced_token_id PK, FK
        uuid project_id FK
        text slot PK
    }

    COMPONENTS {
        uuid id PK
        uuid project_id FK
        text name
        text slug
        text description
        text document_path
    }

    DOCUMENT_TEMPLATES {
        uuid id PK
        uuid project_id FK
        uuid component_id FK
        text name
        text content
    }
```

## Cardinality and relationship notes

- A project owns releases, publish requests, token types, tokens, components, document templates, project memberships, API keys, and project-scoped audit events.
- A release has at most one release snapshot.
- A publish request records the durable idempotency key, payload hash, and first successful response for one publication.
- The composite primary key `(project_id, user_id, request_id)` scopes retry identity to both the project and submitting user.
- A user has zero or many sessions and project memberships.
- A project membership identifies the user's role for one project.
- A token type has zero or one parent and zero or many child token types.
- A token type classifies zero or many tokens.
- `TOKEN_REFERENCES.referencing_token_id` identifies the source token.
- `TOKEN_REFERENCES.referenced_token_id` identifies the target token.
- `TOKEN_REFERENCES.slot` distinguishes semantic or typography reference slots.
- A component has zero or many document templates.
- An audit event may belong to a user and/or a project. `resource_id` is a polymorphic identifier and is not a foreign key.
