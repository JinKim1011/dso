import {
  RATE_LIMIT_POLICIES,
  RateLimitUnavailableError,
  UpstashRateLimitBackend,
  checkRateLimit,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/server/rate-limit";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.restoreAllMocks());

describe("rate limiting", () => {
  it("hashes compound identifiers without retaining readable values", () => {
    const identifier = createRateLimitIdentifier([
      "login",
      "203.0.113.10",
      "admin@example.test",
    ]);

    expect(identifier).toMatch(/^[a-f0-9]{64}$/u);
    expect(identifier).not.toContain("admin");
    expect(identifier).not.toContain("203.0.113.10");
  });

  it("passes decisions through the backend", async () => {
    const decision = {
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt: Date.now() + 10_000,
    };
    const consume = vi.fn().mockResolvedValue(decision);

    await expect(
      checkRateLimit("login", ["203.0.113.10", "admin@example.test"], { consume }),
    ).resolves.toEqual(decision);
    expect(consume).toHaveBeenCalledWith(
      "login",
      createRateLimitIdentifier(["login", "203.0.113.10", "admin@example.test"]),
    );
  });

  it("returns a 429 with retry metadata", async () => {
    const response = rateLimitResponse({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt: Date.now() + 2_500,
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("3");
    expect(response.headers.get("x-ratelimit-limit")).toBe("10");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
  });

  it("defines the approved endpoint policies", () => {
    expect(RATE_LIMIT_POLICIES).toEqual({
      login: { limit: 10, window: "5 m" },
      publish: { limit: 10, window: "10 m" },
      "api-key-create": { limit: 5, window: "1 h" },
      "api-key-revoke": { limit: 20, window: "10 m" },
      "release-download": { limit: 120, window: "1 m" },
    });
  });

  it("fails closed when Upstash times out", async () => {
    const backend = new UpstashRateLimitBackend({
      NODE_ENV: "production",
      KV_REST_API_URL: "https://redis.example.test",
      KV_REST_API_TOKEN: "token",
    });
    const limiter = Reflect.get(backend, "limiters").get("login");
    vi.spyOn(limiter, "limit").mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now(),
      pending: Promise.resolve(),
      reason: "timeout",
    });

    await expect(backend.consume("login", "identifier")).rejects.toBeInstanceOf(
      RateLimitUnavailableError,
    );
  });
});
