import type { Release } from "@repo/contracts/type";
import type { ReleaseStatus } from "@repo/contracts/validation/enum";

type ReleaseRow = {
  id: string;
  project_id: string;
  version: string;
  status: ReleaseStatus;
  created_at: Date;
  published_at: Date | null;
};

export function mapReleaseRow(row: ReleaseRow): Release {
  return {
    id: row.id,
    projectId: row.project_id,
    version: row.version,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    publishedAt: row.published_at?.toISOString() ?? null,
  };
}
