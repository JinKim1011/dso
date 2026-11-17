CREATE TABLE release_snapshots (
  release_id UUID PRIMARY KEY REFERENCES releases (id) ON DELETE CASCADE,
  token_types JSONB NOT NULL,
  tokens JSONB NOT NULL,
  reference_data JSONB NOT NULL,
  components JSONB NOT NULL,
  templates JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE publication_requests (
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  request_id UUID NOT NULL,
  request_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  PRIMARY KEY (project_id, request_id)
);
