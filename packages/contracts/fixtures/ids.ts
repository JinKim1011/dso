import { randomUUID } from "node:crypto";

export const fixtureIds = {
  user: randomUUID(),
  project: randomUUID(),
  session: randomUUID(),

  primitiveTokenType: randomUUID(),
  semanticTokenType: randomUUID(),

  singleToken: randomUUID(),
  modeToken: randomUUID(),

  component: randomUUID(),
  documentTemplate: randomUUID(),
  release: randomUUID(),
  apiKey: randomUUID(),
} as const;
