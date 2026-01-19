import { spawnSync } from "node:child_process";
import process from "node:process";

const FALLBACK_DATABASE_URL =
  "postgresql://user:pass@localhost:5432/db?schema=public";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DATABASE_URL;
  console.log(
    "[Prisma] DATABASE_URL is not set. Using a placeholder value for client generation.",
  );
}

const result = spawnSync("npx prisma generate", {
  shell: true,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
