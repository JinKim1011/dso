import { formatApiBaseUrl, parseApiUrl } from "@repo/cli/config/api-url";
import { describe, expect, it } from "vitest";

describe("API URL policy", () => {
  it.each([
    "https://api.example.test",
    "https://api.example.test/",
    "https://api.example.test/base/",
    "http://localhost:3000",
    "http://127.0.0.1:3000/",
    "http://[::1]:3000",
  ])("accepts %s", (value) => {
    expect(formatApiBaseUrl(parseApiUrl(value))).not.toMatch(/\/$/u);
  });

  it.each([
    "http://api.example.test",
    "ftp://api.example.test",
    "https://user:password@api.example.test",
    "https://user@api.example.test",
    "https://api.example.test?query=1",
    "https://api.example.test#fragment",
    "not-a-url",
  ])("rejects %s", (value) => {
    expect(() => parseApiUrl(value)).toThrow();
  });
});
