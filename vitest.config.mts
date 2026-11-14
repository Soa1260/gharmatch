import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  // Each database test file starts its own in-memory Postgres and applies every migration. When many start at once the
  // default 10 seconds is not enough on a busy machine, which showed up as random "hook timed out" failures.
  test: { environment: "node", include: ["src/**/*.test.ts"], hookTimeout: 60_000, testTimeout: 30_000 },
});
