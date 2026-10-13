CREATE INDEX releases_project_id_idx
ON releases(project_id);

CREATE INDEX token_types_project_id_idx
ON token_types(project_id);

CREATE INDEX token_types_parent_type_idx 
ON token_types(parent_type_id);

CREATE INDEX tokens_project_type_idx
ON tokens(project_id, token_type_id);

CREATE INDEX token_references_referenced_token_idx
ON token_references(referenced_token_id);

CREATE INDEX components_project_id_idx
ON components(project_id);

CREATE INDEX document_templates_component_idx
ON document_templates(component_id);