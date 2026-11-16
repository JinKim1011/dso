import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { getAuthenticatedUser } from "@repo/application/services/authentication";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/server/current-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@repo/application/services/authentication", () => ({
  getAuthenticatedUser: vi.fn(),
}));

const sessionId = "00000000-0000-4000-8000-000000000001";
const context = { sessionId, userId: "00000000-0000-4000-8000-000000000002" };
const user = { id: context.userId, email: "user@example.test" };

function request() {
  return new Request("http://localhost:3000/api/auth/session");
}

describe("session lookup route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getCurrentSession).mockResolvedValue(context);
    vi.mocked(getAuthenticatedUser).mockResolvedValue(user);
  });

  afterEach(() => vi.restoreAllMocks());

  it("returns only safe user details for an authenticated request", async () => {
    const incoming = request();
    const response = await GET(incoming);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({ user });
    expect(getCurrentSession).toHaveBeenCalledWith(incoming);
    expect(getAuthenticatedUser).toHaveBeenCalledWith(getDatabasePool(), context);
  });

  it("returns 401 without looking up a user when unauthenticated", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: "authentication-required", message: "Authentication is required." },
    });
    expect(getDatabasePool).not.toHaveBeenCalled();
    expect(getAuthenticatedUser).not.toHaveBeenCalled();
  });

  it.each(["session", "user"] as const)(
    "returns a generic 500 without logging details when %s lookup fails",
    async (stage) => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error(`sensitive data ${sessionId}`);
      if (stage === "session") vi.mocked(getCurrentSession).mockRejectedValue(error);
      else vi.mocked(getAuthenticatedUser).mockRejectedValue(error);
      const response = await GET(request());
      expect(response.status).toBe(500);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(await response.text()).not.toContain(sessionId);
      expect(log).toHaveBeenCalledWith("Session lookup failed.", { errorType: "Error" });
    },
  );
});
