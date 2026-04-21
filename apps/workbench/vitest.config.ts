import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist"],

    globals: true,

    environment: "jsdom",

    setupFiles: ["./test/setup.ts"],

    passWithNoTests: true,
  },
});
