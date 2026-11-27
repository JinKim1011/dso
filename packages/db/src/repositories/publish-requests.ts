import type { PublishStagedChangesResult } from "@repo/contracts/operation";
import type { PoolClient, QueryResultRow } from "pg";

type PublishRequestRow = QueryResultRow & {
  request_hash: string;
  release_id: string;
  response_data: PublishStagedChangesResult;
};

export type StoredPublishRequest = {
  requestHash: string;
  releaseId: string;
  response: PublishStagedChangesResult;
};

export async function findPublishRequest(
  client: PoolClient,
  projectId: string,
  userId: string,
  requestId: string,
): Promise<StoredPublishRequest | null> {
  const result = await client.query<PublishRequestRow>(
    `
      SELECT request_hash, release_id, response_data
      FROM publish_requests
      WHERE project_id = $1
        AND user_id = $2
        AND request_id = $3
    `,
    [projectId, userId, requestId],
  );

  const row = result.rows[0];
  return row
    ? {
        requestHash: row.request_hash,
        releaseId: row.release_id,
        response: row.response_data,
      }
    : null;
}

export async function insertPublishRequest(
  client: PoolClient,
  input: {
    projectId: string;
    userId: string;
    requestId: string;
    requestHash: string;
    releaseId: string;
    response: PublishStagedChangesResult;
  },
): Promise<void> {
  await client.query(
    `
      INSERT INTO publish_requests (
        project_id,
        user_id,
        request_id,
        request_hash,
        release_id,
        response_data
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [
      input.projectId,
      input.userId,
      input.requestId,
      input.requestHash,
      input.releaseId,
      JSON.stringify(input.response),
    ],
  );
}
