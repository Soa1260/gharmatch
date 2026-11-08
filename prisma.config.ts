import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// The app reads .env.local (Next.js convention), so the migration tool reads it too. .env is the fallback.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/gharmatch" },
});
