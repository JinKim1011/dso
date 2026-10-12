# DSO ERD draft

```mermaid
erDiagram
    PROJECTS ||--o{ RELEASES : owns
    PROJECTS ||--o{ TOKEN_TYPES : owns
    PROJECTS ||--o{ TOKENS : owns
    PROJECTS ||--o{ COMPONENTS : owns
    PROJECTS ||--o{ DOCUMENT_TEMPLATES : owns

    TOKEN_TYPES o|--o{ TOKEN_TYPES : parent_of
    TOKEN_TYPES ||--o{ TOKENS : classifies

    TOKENS ||--o{ TOKEN_REFERENCES : referencing_token
    TOKENS ||--o{ TOKEN_REFERENCES : referenced_token

    COMPONENTS ||--o{ DOCUMENT_TEMPLATES : has

    PROJECTS {
        uuid id PK
        text name
    }

    RELEASES {
        uuid id PK
        uuid project_id FK
        text version
        text status
        timestamp published_at
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
        text mode PK
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

- A project can own zero or many to:
  - releases
  - token types
  - tokens
  - components
  - document templates
- A token type can have zero or one parent token type.
- A token type can have zero or many child token types.
- A token type can classify zero or many tokens.
- A token can reference zero or many other tokens.
- A token can also be referenced by zero or many other tokens.
  - Both directions are represented by `TOKEN_REFERENCES`.
  - `referencing_token_id` is the source and `referenced_token_id` is the target.
- A component can have zero or many document templates.
  - Each document template belongs to exactly one component.

## Important constraints

- `parent_type_id` is a nullable self-referencing foreign key.
- A token cannot reference itself.
- Duplicate token references are rejected for the same source token, target token, and mode.
- Token-type cycles are rejected.
