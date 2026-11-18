import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../next.config.js";

afterEach(() => vi.unstubAllEnvs());

describe("workbench security headers", () => {
  it.each(["development", "production"] as const)(
    "configures all routes and limits HSTS to production: %s",

    async (environment) => {
      vi.stubEnv("NODE_ENV", environment);

      if (!nextConfig.headers) throw new Error("Missing headers configuration.");

      const rules = await nextConfig.headers();

      expect(rules).toHaveLength(1);
      expect(rules[0]?.source).toBe("/:path*");

      const headers = new Headers(
        rules[0]?.headers.map(({ key, value }) => [key, value]),
      );

      expect(headers.get("x-content-type-options")).toBe("nosniff");
      expect(headers.get("x-frame-options")).toBe("DENY");
      expect(headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(headers.get("permissions-policy")).toBe(
        "camera=(), microphone=(), geolocation=()",
      );
      expect(headers.get("content-security-policy")).toBeNull();
      expect(headers.get("content-security-policy-report-only")).toContain(
        "script-src 'self'",
      );
      expect(headers.get("strict-transport-security")).toBe(
        environment === "production" ? "max-age=31536000" : null,
      );
    },
  );
});
