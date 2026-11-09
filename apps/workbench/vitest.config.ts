import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@/features", replacement: path.resolve(__dirname, "./features") },
      { find: "@/server", replacement: path.resolve(__dirname, "./src/server") },
      { find: "@", replacement: path.resolve(__dirname, "./app") },
    ],
  },
  test: {
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist"],

    globals: true,

    environment: "jsdom",

    setupFiles: ["./test/setup.ts"],

    passWithNoTests: true,
  },
});
