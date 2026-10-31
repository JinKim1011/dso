import type { Component } from "@repo/contracts/type";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type ComponentRow = QueryResultRow & {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description: string;
  document_path: string;
};

function mapComponentRow(row: ComponentRow): Component {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    documentPath: row.document_path,
  };
}

export async function insertComponent(
  database: Queryable,
  component: Component,
): Promise<Component> {
  const result = await database.query<ComponentRow>(
    `
      INSERT INTO components (id, project_id, name, slug, description, document_path)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, project_id, name, slug, description, document_path
    `,
    [
      component.id,
      component.projectId,
      component.name,
      component.slug,
      component.description,
      component.documentPath,
    ],
  );

  return mapComponentRow(result.rows[0]!);
}

export async function listComponentsByProjectId(
  database: Queryable,
  projectId: string,
): Promise<Component[]> {
  const result = await database.query<ComponentRow>(
    `
      SELECT id, project_id, name, slug, description, document_path
      FROM components
      WHERE project_id = $1
      ORDER BY id
    `,
    [projectId],
  );

  return result.rows.map(mapComponentRow);
}
