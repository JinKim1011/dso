import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { parseSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import { randomUUID } from "node:crypto";
import { mkdir, open, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function writeVerifiedReleaseCache(
  filePath: string,
  envelope: SignedPublishedReleaseResponse,
): Promise<void> {
  const directory = dirname(filePath);
  const parsed = parseSignedReleaseEnvelope(envelope);

  const temporaryPath = join(directory, `.${randomUUID()}.tmp`);

  let fileHandle: Awaited<ReturnType<typeof open>> | undefined;

  await mkdir(directory, { recursive: true });

  try {
    fileHandle = await open(temporaryPath, "wx", 0o600);

    await writeFile(fileHandle, `${JSON.stringify(parsed)}\n`, "utf8");

    await fileHandle.sync();
    await fileHandle.close();

    fileHandle = undefined;

    await rename(temporaryPath, filePath);
  } catch (error) {
    await fileHandle?.close().catch(() => undefined);

    await rm(temporaryPath, { force: true }).catch(() => undefined);

    throw error;
  }
}
