import { getDatabasePool } from "@/server/database";
import { seedProject } from "@repo/application/fixtures";
import { createApiKey } from "@repo/application/services/api-keys";
import { publishStagedChanges } from "@repo/application/services/staged-publishing";
import { insertRelease } from "@repo/db/repositories/releases";
import { insertSession } from "@repo/db/repositories/sessions";
import { closeDatabase, resetDatabase, setupDatabase } from "@repo/db/test/database";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { GET } from "./route";

vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));

const origin = "https://workbench.example.test";
const futureExpiration = "2099-01-01T00:00:00.000Z";
let database: Awaited<ReturnType<typeof setupDatabase>>;

async function publishRelease(fixture: Awaited<ReturnType<typeof seedProject>>) {
  return publishStagedChanges(database, fixture.context, {
    projectId: fixture.project.id,
    changes: [
      {
        tokenId: fixture.referencedToken.id,
        name: { before: fixture.referencedToken.name, after: "published" },
        references: [],
      },
    ],
  });
}

async function createSession(userId: string): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await insertSession(database, {
    id,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 60_000).toISOString(),
  });
  return id;
}

function request(
  releaseId: string,
  options: { sessionId?: string; credential?: string } = {},
): Request {
  const headers = new Headers();
  if (options.sessionId) {
    headers.set("cookie", `dso_session=${options.sessionId}`);
  }
  if (options.credential) {
    headers.set("authorization", `Bearer ${options.credential}`);
  }
  return new Request(`${origin}/api/releases/${releaseId}`, { headers });
}

function invoke(incoming: Request, releaseId: string) {
  return GET(incoming, { params: Promise.resolve({ releaseId }) });
}

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "published release HTTP and PostgreSQL integration",
  () => {
    beforeAll(async () => {
      database = await setupDatabase();
    });
    beforeEach(async () => {
      await resetDatabase(database);
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("SESSION_COOKIE_NAME", "dso_session");
      vi.mocked(getDatabasePool).mockReturnValue(database);
    });
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetAllMocks();
    });
    afterAll(async () => {
      await closeDatabase();
    });

    it("downloads the published response with a session or API key", async () => {
      const fixture = await seedProject(database, "admin");
      const { release } = await publishRelease(fixture);
      const sessionId = await createSession(fixture.user.id);
      const created = await createApiKey(database, fixture.context, {
        projectId: fixture.project.id,
        expiresAt: futureExpiration,
        scope: "release:read",
      });

      const sessionResponse = await invoke(
        request(release.id, { sessionId }),
        release.id,
      );
      const apiKeyResponse = await invoke(
        request(release.id, { credential: created.credential }),
        release.id,
      );

      expect(sessionResponse.status).toBe(200);
      expect(apiKeyResponse.status).toBe(200);
      expect(sessionResponse.headers.get("cache-control")).toBe("no-store");
      expect(apiKeyResponse.headers.get("cache-control")).toBe("no-store");
      expect(await apiKeyResponse.json()).toEqual(await sessionResponse.json());
    });

    it("returns 401 for missing, malformed, or invalid API-key authentication", async () => {
      const fixture = await seedProject(database, "admin");
      const { release } = await publishRelease(fixture);
      const created = await createApiKey(database, fixture.context, {
        projectId: fixture.project.id,
        expiresAt: futureExpiration,
        scope: "release:read",
      });
      const invalid = `${created.credential.slice(0, -1)}A`;

      for (const incoming of [
        request(release.id),
        request(release.id, { credential: "malformed" }),
        request(release.id, { credential: invalid }),
      ]) {
        const result = await invoke(incoming, release.id);
        expect(result.status).toBe(401);
        expect(await result.json()).toMatchObject({
          error: { code: "invalid-api-key-credential" },
        });
      }
    });

    it("hides releases from another project for both authentication methods", async () => {
      const owner = await seedProject(database, "admin");
      const other = await seedProject(database, "admin");
      const { release } = await publishRelease(owner);
      const otherSessionId = await createSession(other.user.id);
      const created = await createApiKey(database, other.context, {
        projectId: other.project.id,
        expiresAt: futureExpiration,
        scope: "release:read",
      });

      expect(
        (await invoke(request(release.id, { sessionId: otherSessionId }), release.id))
          .status,
      ).toBe(404);
      expect(
        (
          await invoke(
            request(release.id, { credential: created.credential }),
            release.id,
          )
        ).status,
      ).toBe(404);
    });

    it("returns 404 for draft and nonexistent releases", async () => {
      const fixture = await seedProject(database, "admin");
      const created = await createApiKey(database, fixture.context, {
        projectId: fixture.project.id,
        expiresAt: futureExpiration,
        scope: "release:read",
      });
      const draft = await insertRelease(database, {
        id: crypto.randomUUID(),
        projectId: fixture.project.id,
        version: "1",
        status: "draft",
        createdAt: new Date().toISOString(),
        publishedAt: null,
      });

      for (const releaseId of [draft.id, crypto.randomUUID()]) {
        const result = await invoke(
          request(releaseId, { credential: created.credential }),
          releaseId,
        );
        expect(result.status).toBe(404);
      }
    });

    it("does not expose authentication material in a successful response", async () => {
      const fixture = await seedProject(database, "admin");
      const { release } = await publishRelease(fixture);
      const created = await createApiKey(database, fixture.context, {
        projectId: fixture.project.id,
        expiresAt: futureExpiration,
        scope: "release:read",
      });

      const result = await invoke(
        request(release.id, { credential: created.credential }),
        release.id,
      );
      const serialized = await result.text();

      expect(serialized).not.toContain(created.credential);
      expect(serialized).not.toMatch(/keyHash|password|secret|session/i);
    });
  },
);
