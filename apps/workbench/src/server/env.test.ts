import {
  isApiKeyManagementEnabled,
  isPublishEnabled,
  loadRateLimitEnvironment,
  loadWorkbenchFeatureEnvironment,
} from "@/server/env";
import { describe, expect, it } from "vitest";

describe("workbench feature environment", () => {
  it("keeps development mutation behavior available", () => {
    expect(loadWorkbenchFeatureEnvironment({ NODE_ENV: "development" })).toEqual({
      publishEnabled: true,
      apiKeyManagementEnabled: true,
    });
  });

  it("defaults mutations to disabled outside development", () => {
    for (const nodeEnv of ["production", "test"] as const) {
      const env: NodeJS.ProcessEnv = { NODE_ENV: nodeEnv };

      expect(isPublishEnabled(env)).toBe(false);
      expect(isApiKeyManagementEnabled(env)).toBe(false);
    }
  });

  it("enables production mutations only with exact true flags", () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      DSO_PUBLISH_ENABLED: "true",
      DSO_API_KEY_MANAGEMENT_ENABLED: "true",
    };

    expect(isPublishEnabled(env)).toBe(true);
    expect(isApiKeyManagementEnabled(env)).toBe(true);
  });

  it.each(["1", "TRUE", "yes", ""])("rejects invalid boolean flag %j", (value) => {
    expect(() =>
      loadWorkbenchFeatureEnvironment({
        NODE_ENV: "production",
        DSO_PUBLISH_ENABLED: value,
      }),
    ).toThrow('DSO_PUBLISH_ENABLED must be "true" or "false".');
  });

  it("loads Vercel Upstash REST credentials", () => {
    expect(
      loadRateLimitEnvironment({
        NODE_ENV: "production",
        KV_REST_API_URL: "https://redis.example.test",
        KV_REST_API_TOKEN: "token",
      }),
    ).toEqual({
      restUrl: "https://redis.example.test",
      restToken: "token",
    });
  });

  it("rejects incomplete rate-limit credentials", () => {
    expect(() =>
      loadRateLimitEnvironment({
        NODE_ENV: "production",
        KV_REST_API_URL: "https://redis.example.test",
      }),
    ).toThrow("KV_REST_API_TOKEN or UPSTASH_REDIS_REST_TOKEN is required");
  });
});
