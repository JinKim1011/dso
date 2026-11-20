import { CliConfigurationError } from "@repo/cli/errors";
import { toEd25519PublicKey } from "@repo/release-protocol/keys";
import type { KeyObject } from "node:crypto";
import { readFile } from "node:fs/promises";

function invalidTrustFile(): never {
  throw new CliConfigurationError();
}

function skipWhitespace(source: string, start: number): number {
  let index = start;
  while (/\s/u.test(source[index] ?? "")) index += 1;
  return index;
}

function readString(source: string, start: number): { value: string; end: number } {
  if (source[start] !== '"') return invalidTrustFile();

  let index = start + 1;

  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }
    if (source[index] === '"') {
      const end = index + 1;
      return { value: JSON.parse(source.slice(start, end)), end };
    }
    index += 1;
  }

  return invalidTrustFile();
}

function skipValue(source: string, start: number): number {
  let index = skipWhitespace(source, start);

  if (source[index] === '"') return readString(source, index).end;
  if (source[index] === "{") return skipObject(source, index);
  if (source[index] === "[") {
    index += 1;

    index = skipWhitespace(source, index);

    while (source[index] !== "]") {
      index = skipValue(source, index);
      index = skipWhitespace(source, index);
      if (source[index] === ",") index += 1;
      else if (source[index] !== "]") return invalidTrustFile();
    }

    return index + 1;
  }

  while (index < source.length && !/[\s,}\]]/u.test(source[index] ?? "")) {
    index += 1;
  }

  return index;
}

function readMembers(
  source: string,
  start: number,
): Array<{ key: string; start: number; end: number }> {
  const members: Array<{ key: string; start: number; end: number }> = [];

  let index = skipWhitespace(source, start + 1);

  while (source[index] !== "}") {
    const key = readString(source, index);

    index = skipWhitespace(source, key.end);

    if (source[index] !== ":") return invalidTrustFile();

    const valueStart = index + 1;
    const end = skipValue(source, valueStart);

    members.push({ key: key.value, start: valueStart, end });

    index = skipWhitespace(source, end);

    if (source[index] === ",") index = skipWhitespace(source, index + 1);
    else if (source[index] !== "}") return invalidTrustFile();
  }

  return members;
}

function skipObject(source: string, start: number): number {
  const members = readMembers(source, start);

  const last = members.at(-1);

  return skipWhitespace(source, last?.end ?? start + 1) + 1;
}

function trustKeyMembers(source: string): string[] {
  const root = readMembers(source, skipWhitespace(source, 0));

  const keysMember = root.find((member) => member.key === "keys");

  if (!keysMember) return invalidTrustFile();

  const objectStart = skipWhitespace(source, keysMember.start);

  if (source[objectStart] !== "{") return invalidTrustFile();

  return readMembers(source, objectStart).map((member) => member.key);
}

export async function loadReleaseTrustFile(
  filePath: string,
): Promise<ReadonlyMap<string, KeyObject>> {
  let source: string;

  try {
    source = await readFile(filePath, "utf8");
  } catch {
    throw new CliConfigurationError();
  }

  let document: unknown;

  try {
    document = JSON.parse(source);
  } catch {
    return invalidTrustFile();
  }
  if (
    typeof document !== "object" ||
    document === null ||
    Array.isArray(document) ||
    Object.keys(document).length !== 1 ||
    !Object.hasOwn(document, "keys")
  ) {
    return invalidTrustFile();
  }

  const keys = (document as { keys: unknown }).keys;

  if (
    typeof keys !== "object" ||
    keys === null ||
    Array.isArray(keys) ||
    Object.keys(keys).length === 0
  ) {
    return invalidTrustFile();
  }

  const rawKeyIds = trustKeyMembers(source);

  if (
    new Set(rawKeyIds).size !== rawKeyIds.length ||
    rawKeyIds.length !== Object.keys(keys).length
  ) {
    return invalidTrustFile();
  }

  const trusted = new Map<string, KeyObject>();

  for (const [keyId, encodedPublicKey] of Object.entries(keys)) {
    if (
      keyId.length === 0 ||
      keyId.trim() !== keyId ||
      typeof encodedPublicKey !== "string" ||
      encodedPublicKey.includes("PRIVATE KEY")
    ) {
      return invalidTrustFile();
    }
    try {
      trusted.set(keyId, toEd25519PublicKey(encodedPublicKey));
    } catch {
      return invalidTrustFile();
    }
  }

  return trusted;
}
