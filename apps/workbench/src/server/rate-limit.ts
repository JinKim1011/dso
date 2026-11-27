import { loadRateLimitEnvironment } from "@/server/env";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

export type RateLimitPolicyName =
  "login" | "publish" | "api-key-create" | "api-key-revoke" | "release-download";

type RateLimitPolicy = Readonly<{
  limit: number;
  window: "1 m" | "5 m" | "10 m" | "1 h";
}>;

export type RateLimitDecision = Readonly<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}>;

export interface RateLimitBackend {
  consume(policy: RateLimitPolicyName, identifier: string): Promise<RateLimitDecision>;
}

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Rate limiting is unavailable.");
    this.name = "RateLimitUnavailableError";
  }
}

export const RATE_LIMIT_POLICIES: Readonly<Record<RateLimitPolicyName, RateLimitPolicy>> =
  {
    login: { limit: 10, window: "5 m" },
    publish: { limit: 10, window: "10 m" },
    "api-key-create": { limit: 5, window: "1 h" },
    "api-key-revoke": { limit: 20, window: "10 m" },
    "release-download": { limit: 120, window: "1 m" },
  };

export function createRateLimitIdentifier(parts: readonly string[]): string {
  const digest = createHash("sha256")
    .update(parts.map((part) => `${part.length}:${part}`).join("|"))
    .digest("hex");

  return digest;
}

export class UpstashRateLimitBackend implements RateLimitBackend {
  private readonly limiters: Map<RateLimitPolicyName, Ratelimit>;

  constructor(env: NodeJS.ProcessEnv) {
    const { restUrl, restToken } = loadRateLimitEnvironment(env);
    const redis = new Redis({ url: restUrl, token: restToken });

    this.limiters = new Map(
      Object.entries(RATE_LIMIT_POLICIES).map(([name, policy]) => [
        name as RateLimitPolicyName,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
          prefix: `dso:${name}`,
          timeout: 1_000,
        }),
      ]),
    );
  }

  async consume(
    policy: RateLimitPolicyName,
    identifier: string,
  ): Promise<RateLimitDecision> {
    const limiter = this.limiters.get(policy);
    if (!limiter) {
      throw new RateLimitUnavailableError();
    }

    try {
      const result = await limiter.limit(identifier);
      if (result.reason === "timeout") {
        throw new RateLimitUnavailableError();
      }

      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) throw error;

      throw new RateLimitUnavailableError();
    }
  }
}

let backend: RateLimitBackend | undefined;

export function getRateLimitBackend(): RateLimitBackend {
  backend ??= new UpstashRateLimitBackend(process.env);
  return backend;
}

export async function checkRateLimit(
  policy: RateLimitPolicyName,
  identifiers: readonly string[],
  rateLimitBackend = getRateLimitBackend(),
): Promise<RateLimitDecision> {
  return rateLimitBackend.consume(
    policy,
    createRateLimitIdentifier([policy, ...identifiers]),
  );
}

export function rateLimitResponse(decision: RateLimitDecision): Response {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((decision.resetAt - Date.now()) / 1_000),
  );

  return Response.json(
    {
      ok: false,
      error: {
        code: "rate-limit-exceeded",
        message: "Too many requests. Please try again later.",
      },
    },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": decision.limit.toString(),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
