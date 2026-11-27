CREATE TABLE publish_requests (
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  request_id UUID NOT NULL,
  request_hash TEXT NOT NULL,
  release_id UUID NOT NULL REFERENCES releases (id) ON DELETE CASCADE,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id, request_id),
  CHECK (request_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX publish_requests_release_id_idx ON publish_requests (release_id);
