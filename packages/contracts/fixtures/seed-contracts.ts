// provides focused seed records for validation tests.

import { fixtureIds } from "@repo/contracts/fixtures/ids";
import type { SeedData } from "@repo/contracts/seed";
import type { Project, ProjectMember, Release, User } from "@repo/contracts/type";

const fixtureTimestamp = "2026-10-27T10:00:00.000Z";

export const seedUserFixture = {
  id: fixtureIds.user,
  email: "seed-user@example.test",
  passwordHash: "not-a-real-password-hash",
  createdAt: fixtureTimestamp,
} satisfies User;

export const seedProjectFixture = {
  id: fixtureIds.project,
  slug: "seed-project",
  name: "Seed Project",
  createdAt: fixtureTimestamp,
} satisfies Project;

export const seedProjectMemberFixture = {
  projectId: fixtureIds.project,
  userId: fixtureIds.user,
  role: "publisher",
  createdAt: fixtureTimestamp,
} satisfies ProjectMember;

export const seedReleaseFixture = {
  id: fixtureIds.release,
  projectId: fixtureIds.project,
  version: "1.0.0",
  status: "published",
  createdAt: fixtureTimestamp,
  publishedAt: fixtureTimestamp,
} satisfies Release;

export function createSeedData(overrides: Partial<SeedData> = {}): SeedData {
  return {
    users: [],
    projects: [],
    projectMembers: [],
    tokenTypes: [],
    tokens: [],
    tokenReferences: [],
    components: [],
    documentTemplates: [],
    releases: [],
    ...overrides,
  };
}