import type { PublishStagedChangesResult } from "@repo/contracts/operation";
import type { PoolClient } from "pg";

type PublicationRequest = {
  request_hash: string;
  response: PublishStagedChangesResult;
};

export async function findPublicationRequest(
  client: Pick<PoolClient, "query">,
  projectId: string,
  requestId: string,
): Promise<PublicationRequest | null> {
  const result = await client.query<PublicationRequest>(
    `SELECT request_hash, response
     FROM publication_requests WHERE project_id = $1 AND request_id = $2`,
    [projectId, requestId],
  );
  return result.rows[0] ?? null;
}

export async function insertPublicationRequest(
  client: Pick<PoolClient, "query">,
  projectId: string,
  requestId: string,
  requestHash: string,
  response: PublishStagedChangesResult,
): Promise<void> {
  await client.query(
    `INSERT INTO publication_requests (project_id, request_id, request_hash, response)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [projectId, requestId, requestHash, JSON.stringify(response)],
  );
}
