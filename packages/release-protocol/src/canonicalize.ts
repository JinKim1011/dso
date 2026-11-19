import type {
  PublishedReleaseResponse,
  SignedPublishedReleaseResponse,
} from "@repo/contracts/operation";
import { assertReleaseSize } from "@repo/release-protocol/limits";

type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;
type JsonObject = { [key: string]: JsonValue };

function canonicalizeValue(value: unknown, ancestors: Set<object>): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical release values must contain finite numbers.");
    }
    return JSON.stringify(value);
  }

  if (typeof value !== "object") {
    throw new TypeError("Canonical release values must be valid JSON values.");
  }

  if (ancestors.has(value)) {
    throw new TypeError("Canonical release values cannot contain cycles.");
  }

  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) {
          throw new TypeError("Canonical release arrays cannot be sparse.");
        }
      }

      if (
        Object.keys(value).some(
          (key) => !/^(0|[1-9]\d*)$/u.test(key) || Number(key) >= value.length,
        ) ||
        Object.getOwnPropertySymbols(value).length > 0
      ) {
        throw new TypeError("Canonical release arrays cannot contain extra properties.");
      }

      return `[${value.map((entry) => canonicalizeValue(entry, ancestors)).join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Canonical release values must be plain objects.");
    }

    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError("Canonical release objects cannot contain symbol keys.");
    }

    const entries = Object.entries(value).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );

    return `{${entries
      .map(
        ([key, entry]) => `${JSON.stringify(key)}:${canonicalizeValue(entry, ancestors)}`,
      )
      .join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalizeRelease(
  release: PublishedReleaseResponse | SignedPublishedReleaseResponse,
): string {
  const { signature: _, ...payload } = release as SignedPublishedReleaseResponse;

  const serialized = canonicalizeValue(payload as unknown as JsonValue, new Set());

  assertReleaseSize(serialized);

  return serialized;
}
