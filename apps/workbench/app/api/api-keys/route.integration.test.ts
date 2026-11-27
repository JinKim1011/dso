import { getDatabasePool } from "@/server/database";
import { getReleaseSigningConfiguration } from "@/server/config";
import { seedProject } from "@repo/application/fixtures";
import { publishStagedChanges } from "@repo/application/services/staged-publishing";
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
import { GET as getRelease } from "../releases/[releaseId]/route";
import { POST as revokeApiKeyRoute } from "./[apiKeyId]/revoke/route";
import { POST } from "./route";
import { generateKeyPairSync } from "node:crypto";

vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));
vi.mock("@/server/config", () => ({
  getReleaseSigningConfiguration: vi.fn(),
}));

const origin = "http://localhost:3000";
const signingKeyPair = generateKeyPairSync("ed25519");
let database: Awaited<ReturnType<typeof setupDatabase>>;

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
  fixture: Awaited<ReturnType<typeof seedProject>>,
  sessionId: string,
): Request {
  return new Request(`${origin}/api/api-keys`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      "x-dso-csrf": "1",
      cookie: `dso_session=${sessionId}`,
    },
    body: JSON.stringify({
      projectId: fixture.project.id,
      expiresAt: "2099-01-01T00:00:00.000Z",
      scope: "release:read",
    }),
  });
}

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "API-key creation HTTP and PostgreSQL integration",
  () => {
    beforeAll(async () => {
      database = await setupDatabase();
    });
    beforeEach(async () => {
      await resetDatabase(database);
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
      vi.stubEnv("SESSION_COOKIE_NAME", "dso_session");
      vi.mocked(getDatabasePool).mockReturnValue(database);
      vi.mocked(getReleaseSigningConfiguration).mockReturnValue({
        keyId: "release-key-integration",
        privateKey: signingKeyPair.privateKey,
      });
    });
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetAllMocks();
    });
    afterAll(async () => {
      await closeDatabase();
    });

    it("creates a usable credential for an admin and records the audit event", async () => {
      const fixture = await seedProject(database, "admin");
      const sessionId = await createSession(fixture.user.id);
      const { release } = await publishStagedChanges(database, fixture.context, {
        requestId: crypto.randomUUID(),
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencedToken.id,
            name: { before: fixture.referencedToken.name, after: "published" },
            references: [],
          },
        ],
      });

      const created = await POST(request(fixture, sessionId));
      const body = await created.json();

      expect(created.status).toBe(201);
      expect(created.headers.get("cache-control")).toBe("no-store");
      expect(body).toMatchObject({
        apiKey: {
          projectId: fixture.project.id,
          scope: "release:read",
        },
        credential: expect.stringMatching(/^dso_[0-9a-f]{16}_.{43}$/),
      });
      expect(body).not.toHaveProperty("secret");

      const releaseResponse = await getRelease(
        new Request(`${origin}/api/releases/${release.id}`, {
          headers: { authorization: `Bearer ${body.credential}` },
        }),
        { params: Promise.resolve({ releaseId: release.id }) },
      );

      expect(releaseResponse.status).toBe(200);
      expect(await releaseResponse.json()).toMatchObject({
        schemaVersion: 1,
        release: { id: release.id, status: "published" },
      });

      const audit = await database.query(
        "SELECT action, resource_id FROM audit_events WHERE action = 'api_key.created'",
      );
      expect(audit.rows).toEqual([
        { action: "api_key.created", resource_id: body.apiKey.id },
      ]);
    });

    it.each(["editor", "publisher"] as const)(
      "does not let a %s create an API key",
      async (role) => {
        const fixture = await seedProject(database, role);
        const sessionId = await createSession(fixture.user.id);

        const result = await POST(request(fixture, sessionId));

        expect(result.status).toBe(403);
        expect(await result.json()).toMatchObject({
          error: { code: "project-access-denied" },
        });
      },
    );

    it("revokes an API key through HTTP and immediately blocks release access", async () => {
      const fixture = await seedProject(database, "admin");
      const sessionId = await createSession(fixture.user.id);
      const { release } = await publishStagedChanges(database, fixture.context, {
        requestId: crypto.randomUUID(),
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencedToken.id,
            name: { before: fixture.referencedToken.name, after: "published" },
            references: [],
          },
        ],
      });

      const createdResponse = await POST(request(fixture, sessionId));
      const createdBody = await createdResponse.json();

      const revokedResponse = await revokeApiKeyRoute(
        new Request(`${origin}/api/api-keys/${createdBody.apiKey.id}/revoke`, {
          method: "POST",
          headers: {
            origin,
            "content-type": "application/json",
            "x-dso-csrf": "1",
            cookie: `dso_session=${sessionId}`,
          },
          body: JSON.stringify({ projectId: fixture.project.id }),
        }),
        { params: Promise.resolve({ apiKeyId: createdBody.apiKey.id }) },
      );
      const revokedBody = await revokedResponse.json();

      expect(revokedResponse.status).toBe(200);
      expect(revokedBody).toMatchObject({
        ok: true,
        apiKey: {
          id: createdBody.apiKey.id,
          projectId: fixture.project.id,
          revokedAt: expect.any(String),
        },
      });
      expect(revokedBody.apiKey).not.toHaveProperty("keyHash");

      const releaseResponse = await getRelease(
        new Request(`${origin}/api/releases/${release.id}`, {
          headers: { authorization: `Bearer ${createdBody.credential}` },
        }),
        { params: Promise.resolve({ releaseId: release.id }) },
      );

      expect(releaseResponse.status).toBe(401);

      const audit = await database.query(
        `
          SELECT action, resource_id
          FROM audit_events
          WHERE action = 'api_key.revoked'
            AND resource_id = $1
        `,
        [createdBody.apiKey.id],
      );
      expect(audit.rows).toEqual([
        {
          action: "api_key.revoked",
          resource_id: createdBody.apiKey.id,
        },
      ]);
    });
  },
);
