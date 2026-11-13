import { ResourceNotFoundError } from "@repo/application/errors";
import { lockProjectForUpdate } from "@repo/db/repositories/projects";
import { withTransaction } from "@repo/db/transaction";
import type { Pool, PoolClient } from "pg";

export async function withProjectTransaction<T>(
  database: Pool,
  projectId: string,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withTransaction(database, async (client) => {
    await client.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    if (!(await lockProjectForUpdate(client, projectId))) {
      throw new ResourceNotFoundError();
    }

    return operation(client);
  });
}
