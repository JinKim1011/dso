-- Projects and releases
ALTER TABLE projects
ADD CONSTRAINT projects_name_unique UNIQUE (name);

ALTER TABLE projects
ADD CONSTRAINT projects_slug_unique UNIQUE (slug);

ALTER TABLE releases
ADD CONSTRAINT releases_project_version_unique UNIQUE (project_id, version);

ALTER TABLE releases
ADD CONSTRAINT releases_status_check CHECK (status IN ('draft', 'published'));

ALTER TABLE releases
ADD CONSTRAINT releases_publication_timestamp_check CHECK (
  (
    status = 'draft'
    AND published_at IS NULL
  )
  OR (
    status IN ('published')
    AND published_at IS NOT NULL
  )
);

-- Token type hierarchy
ALTER TABLE token_types
ADD CONSTRAINT token_types_project_and_id_unique UNIQUE (project_id, id);

ALTER TABLE token_types
ADD CONSTRAINT token_types_not_own_parent_check CHECK (
  parent_type_id IS NULL
  OR parent_type_id <> id
);

ALTER TABLE token_types
ADD CONSTRAINT token_types_parent_same_project_fk FOREIGN KEY (project_id, parent_type_id) REFERENCES token_types (project_id, id);

-- Token ownsership
ALTER TABLE tokens
ADD CONSTRAINT tokens_project_and_id_unique UNIQUE (project_id, id);

ALTER TABLE tokens
ADD CONSTRAINT tokens_token_type_same_project_fk FOREIGN KEY (project_id, token_type_id) REFERENCES token_types (project_id, id);

-- Token references
ALTER table token_references
ADD CONSTRAINT referencing_token_and_slot_unique UNIQUE (referencing_token_id, slot);

ALTER TABLE token_references
ADD CONSTRAINT token_references_slot_check CHECK (
  slot IN (
    'light',
    'dark',
    'value',
    'fontSize',
    'fontWeight',
    'lineHeight'
  )
);

ALTER TABLE token_references
ADD CONSTRAINT token_referenced_same_project_fk FOREIGN KEY (project_id, referenced_token_id) REFERENCES tokens (project_id, id);

ALTER TABLE token_references
ADD CONSTRAINT token_referencing_same_project_fk FOREIGN KEY (project_id, referencing_token_id) REFERENCES tokens (project_id, id);

ALTER TABLE token_references
ADD CONSTRAINT token_references_referencing_token_fk FOREIGN KEY (referencing_token_id) REFERENCES tokens (id);

ALTER TABLE token_references
ADD CONSTRAINT token_references_referenced_token_fk FOREIGN KEY (referenced_token_id) REFERENCES tokens (id);

ALTER TABLE token_references
ADD CONSTRAINT token_reference_not_own_token_check CHECK (referenced_token_id <> referencing_token_id);

-- Components and document templates
ALTER TABLE components
ADD CONSTRAINT components_project_and_id_unique UNIQUE (project_id, id);

ALTER TABLE components
ADD CONSTRAINT component_project_and_slug_unique UNIQUE (project_id, slug);

ALTER TABLE document_templates
ADD CONSTRAINT document_templates_component_same_project_fk FOREIGN KEY (project_id, component_id) REFERENCES components (project_id, id);

-- Users
ALTER table users
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Project members
ALTER TABLE project_members
ADD CONSTRAINT project_members_role_check CHECK (role IN ('editor', 'publisher', 'admin'));

-- API keys
ALTER TABLE api_keys
ADD CONSTRAINT api_keys_identifier_unique UNIQUE (key_identifier);

ALTER TABLE api_keys
ADD CONSTRAINT api_keys_scope_check CHECK (scope IN ('release:read'));
