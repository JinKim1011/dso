import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { validateRequestBodySize } from "@repo/contracts/validation/request";
import { describe, expect, it } from "vitest";

describe("validateRequestBodySize", () => {
  const limit = CONTRACT_LIMITS.requestBodyBytes;

  it("accepts a body exactly at the byte limit", () => {
    const body = "a".repeat(limit);

    expect(validateRequestBodySize(body)).toBeNull();
  });

  it("rejects a body one byte over the limit", () => {
    const body = "a".repeat(limit + 1);

    expect(validateRequestBodySize(body)).toEqual({
      field: "",
      code: "too-long",
      message: `Request body cannot exceed ${limit} bytes.`,
    });
  });

  it("accepts a Uint8Array exactly at the byte limit", () => {
    const body = new Uint8Array(limit);

    expect(validateRequestBodySize(body)).toBeNull();
  });

  it("rejects a Uint8Array one byte over the limit", () => {
    const body = new Uint8Array(limit + 1);

    expect(validateRequestBodySize(body)).toEqual({
      field: "",
      code: "too-long",
      message: `Request body cannot exceed ${limit} bytes.`,
    });
  });

  it("measures Unicode strings by UTF-8 byte length", () => {
    const body = "é".repeat(limit / 2);

    expect(body.length).toBe(limit / 2); // UTF-16 code units
    expect(new TextEncoder().encode(body).byteLength).toBe(limit); // UTF-8 bytes
    expect(validateRequestBodySize(body)).toBeNull();
  });
});
