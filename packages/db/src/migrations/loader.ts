import type { Migration } from "@repo/db/migrations/types";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export async function loadMigrations(directory: string): Promise<Migration[]> {
  const entries = await readdir(directory, { withFileTypes: true });

  const names = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(
    names.map(async (name) => ({
      name,
      sql: await readFile(path.join(directory, name), "utf-8"),
    })),
  );
}
