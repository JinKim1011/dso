export type Migration = {
  name: string;
  sql: string;
};

export type MigrationHistoryStore = {
  ensureTable(): Promise<void>;
  getApplied(): Promise<Set<string>>;
  recordApplied(name: string): Promise<void>;
};
