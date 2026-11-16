import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": path.resolve(import.meta.dirname, "src/test/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    // Temporary: remove with src/test/zstd-polyfill.cjs when local Node >= 22.15 (jsdom 31 needs zlib zstd).
    execArgv: ["--require", path.resolve(import.meta.dirname, "src/test/zstd-polyfill.cjs")],
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
