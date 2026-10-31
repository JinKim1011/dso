import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@repo/db": path.resolve(import.meta.dirname, "../src"),
      "@repo/contracts": path.resolve(import.meta.dirname, "../../contracts"),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
