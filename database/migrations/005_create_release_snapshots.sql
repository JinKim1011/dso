CREATE TABLE release_snapshots (
  release_id UUID PRIMARY KEY REFERENCES releases (id) ON DELETE CASCADE,
  token_types JSONB NOT NULL,
  tokens JSONB NOT NULL,
  "references" JSONB NOT NULL,
  components JSONB NOT NULL,
  templates JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
