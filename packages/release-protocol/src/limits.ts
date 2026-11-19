export const MAX_RELEASE_BYTES = 5 * 1024 * 1024;

export function assertReleaseSize(serialized: string): void {
  if (Buffer.byteLength(serialized, "utf8") > MAX_RELEASE_BYTES) {
    throw new RangeError(
      `Canonical release exceeds the ${MAX_RELEASE_BYTES}-byte limit.`,
    );
  }
}
