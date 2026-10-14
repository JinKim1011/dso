CREATE TABLE tokens (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects (id),
  token_type_id UUID NOT NULL,
  name TEXT NOT NULL,
  css_var TEXT NOT NULL,
  value JSONB NOT NULL
);

CREATE TABLE document_templates (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects (id),
  component_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL
);
