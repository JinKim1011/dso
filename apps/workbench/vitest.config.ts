import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist"],

    globals: true,

    environment: "jsdom",

    setupFiles: ["./test/setup.ts"],

    passWithNoTests: true,
  },
});
