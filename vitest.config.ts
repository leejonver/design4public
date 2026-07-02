import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${path.resolve(__dirname, "./")}/`,
      },
      // `server-only` is a Next build-time guard with no Vitest provider.
      {
        find: /^server-only$/,
        replacement: path.resolve(__dirname, "./tests/stubs/server-only.ts"),
      },
    ],
  },
  // The Tailwind v4 PostCSS config isn't loadable by Vitest's Vite pipeline;
  // component tests don't need it, so use an empty inline PostCSS config.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    reporters: process.env.CI ? ["github", "default"] : ["default"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
