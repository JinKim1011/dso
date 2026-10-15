CREATE TABLE token_references (
  referencing_token_id UUID NOT NULL,
  referenced_token_id UUID NOT NULL,
  mode TEXT NOT NULL,
  PRIMARY KEY (referencing_token_id, referenced_token_id, mode)
);
