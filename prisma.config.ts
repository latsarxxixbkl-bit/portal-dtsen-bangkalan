// Prisma config — loads from .env.local (Next.js convention) when present,
// falling back to .env. Connection URL is the Supabase pooler URL.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (Next.js convention), then .env as fallback.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
