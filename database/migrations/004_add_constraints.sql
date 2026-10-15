ALTER TABLE projects
ADD CONSTRAINT projects_name_unique UNIQUE (name);

ALTER TABLE releases
ADD CONSTRAINT releases_project_version_unique UNIQUE (project_id, version);

ALTER TABLE releases
ADD CONSTRAINT releases_status_check CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE releases
ADD CONSTRAINT releases_publication_timestamp_check CHECK (
  (
    status = 'draft'
    AND published_at IS NULL
  )
  OR (
    status IN ('published', 'archived')
    AND published_at IS NOT NULL
  )
);

ALTER TABLE token_types
ADD CONSTRAINT token_types_project_and_id_unique UNIQUE (project_id, id);

ALTER TABLE components
ADD CONSTRAINT components_project_and_id_unique UNIQUE (project_id, id);

ALTER TABLE token_types
ADD CONSTRAINT token_types_not_own_parent_check CHECK (
  parent_type_id IS NULL
  OR parent_type_id <> id
);

ALTER TABLE token_types
ADD CONSTRAINT token_types_parent_same_project_fk FOREIGN KEY (project_id, parent_type_id) REFERENCES token_types (project_id, id);

ALTER TABLE tokens
ADD CONSTRAINT tokens_token_type_same_project_fk FOREIGN KEY (project_id, token_type_id) REFERENCES token_types (project_id, id);

ALTER TABLE document_templates
ADD CONSTRAINT document_templates_component_same_project_fk FOREIGN KEY (project_id, component_id) REFERENCES components (project_id, id);

ALTER TABLE token_references
ADD CONSTRAINT token_references_mode_check CHECK (mode IN ('light', 'dark', 'default'));

ALTER TABLE token_references
ADD CONSTRAINT token_references_referencing_token_fk FOREIGN KEY (referencing_token_id) REFERENCES tokens (id);

ALTER TABLE token_references
ADD CONSTRAINT token_references_referenced_token_fk FOREIGN KEY (referenced_token_id) REFERENCES tokens (id);

ALTER TABLE token_references
ADD CONSTRAINT token_reference_not_own_token_check CHECK (referenced_token_id <> referencing_token_id);
