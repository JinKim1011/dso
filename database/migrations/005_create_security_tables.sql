CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects (id),
  user_id UUID NOT NULL REFERENCES users (id),
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
)
