import { defineConfig } from "prisma/config";

// Con un prisma.config.ts, Prisma deja de leer .env por su cuenta.
// En Vercel no existe .env (las variables ya vienen del entorno), por eso el try.
try {
  process.loadEnvFile(".env");
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --env-file=.env prisma/seed.ts",
  },
});
