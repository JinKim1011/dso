CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

CREATE TABLE releases (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects (id),
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  published_at TIMESTAMPTZ
);

CREATE TABLE token_types (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects (id),
  parent_type_id UUID,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  kind TEXT NOT NULL
);

CREATE TABLE components (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects (id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  document_path TEXT NOT NULL
);
