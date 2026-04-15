import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist"],

    globals: true,

    environment: "jsdom",

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
