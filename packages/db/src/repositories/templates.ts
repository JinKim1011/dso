import type { DocumentTemplate } from "@repo/contracts/type";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type DocumentTemplateRow = QueryResultRow & {
  id: string;
  project_id: string;
  component_id: string;
  name: string;
  content: string;
};

function mapDocumentTemplateRow(row: DocumentTemplateRow): DocumentTemplate {
  return {
    id: row.id,
    projectId: row.project_id,
    componentId: row.component_id,
    name: row.name,
    content: row.content,
  };
}

export async function insertDocumentTemplate(
  database: Queryable,
  documentTemplate: DocumentTemplate,
): Promise<DocumentTemplate> {
  const result = await database.query<DocumentTemplateRow>(
    `
      INSERT INTO document_templates (id, project_id, component_id, name, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, project_id, component_id, name, content
    `,
    [
      documentTemplate.id,
      documentTemplate.projectId,
      documentTemplate.componentId,
      documentTemplate.name,
      documentTemplate.content,
    ],
  );

  return mapDocumentTemplateRow(result.rows[0]!);
}

export async function listDocumentTemplatesByProjectId(
  database: Queryable,
  projectId: string,
): Promise<DocumentTemplate[]> {
  const result = await database.query<DocumentTemplateRow>(
    `
      SELECT id, project_id, component_id, name, content
      FROM document_templates
      WHERE project_id = $1
      ORDER BY id
    `,
    [projectId],
  );

  return result.rows.map(mapDocumentTemplateRow);
}
