import { randomUUID } from "node:crypto";

export const fixtureIds = {
  user: randomUUID(),
  project: randomUUID(),
  session: randomUUID(),

  baseTokenType: randomUUID(),
  semanticTokenType: randomUUID(),

  whiteToken: randomUUID(),
  surfaceToken: randomUUID(),

  component: randomUUID(),
  documentTemplate: randomUUID(),
  release: randomUUID(),
  apiKey: randomUUID(),
} as const;
