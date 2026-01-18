import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import process from "node:process";

const INITIAL_MIGRATION = "20260117000000_init";
const PRIMARY_TABLE = "Account";

function runCommand(command) {
  const result = spawnSync(command, {
    shell: true,
    encoding: "utf8",
    stdio: "pipe",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output.trim()) {
    process.stdout.write(output);
  }
  return { status: result.status ?? 1, output };
}

async function checkTableExists() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ${PRIMARY_TABLE}
      ) AS "exists";
    `;

    if (Array.isArray(result) && result.length > 0) {
      return result[0]?.exists === true;
    }

    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set. Skipping database migrations.");
    console.log("Migrations will be applied when the application starts or via manual deploy.");
    return;
  }

  console.log("Checking database schema...");
  const tableExists = await checkTableExists();

  if (!tableExists) {
    console.log(
      `Table '${PRIMARY_TABLE}' was not found. Creating schema via Prisma migrations...`,
    );
  } else {
    console.log(`Table '${PRIMARY_TABLE}' exists. Applying pending migrations...`);
  }

  const migrateResult = runCommand("npx prisma migrate deploy");

  if (migrateResult.status === 0) {
    console.log("Migrations applied successfully.");
    return;
  }

  const output = migrateResult.output;

  if (output.includes("P3005")) {
    console.log("");
    console.log(
      "Detected P3005 error: Database schema is not empty but has no migration history.",
    );
    console.log("Baselining database by marking initial migration as applied...");
    runCommand(`npx prisma migrate resolve --applied "${INITIAL_MIGRATION}"`);

    console.log("Running remaining migrations...");
    runCommand("npx prisma migrate deploy");

    console.log("Database migration completed successfully.");
    return;
  }

  if (output.includes("already been applied")) {
    console.log("All migrations have already been applied.");
    return;
  }

  if (output.includes("does not exist")) {
    console.log("");
    console.log("Database tables don't exist. Attempting to create schema...");
    runCommand("npx prisma db push --accept-data-loss");

    console.log("Marking initial migration as applied...");
    runCommand(`npx prisma migrate resolve --applied "${INITIAL_MIGRATION}"`);

    console.log("Database schema created successfully.");
    return;
  }

  if (
    output.includes("42P07") ||
    output.includes("already exists") ||
    output.includes("relação")
  ) {
    console.log("");
    console.log("Detected existing table error. Baselining initial migration...");
    runCommand(`npx prisma migrate resolve --applied "${INITIAL_MIGRATION}"`);

    console.log("Running remaining migrations...");
    runCommand("npx prisma migrate deploy");

    console.log("Database migration completed successfully.");
    return;
  }

  console.error("");
  console.error(
    `Migration failed with unexpected error. Exit code: ${migrateResult.status}`,
  );
  process.exit(migrateResult.status ?? 1);
}

main().catch((error) => {
  console.error("Unexpected error while ensuring database schema:");
  console.error(error);
  process.exit(1);
});
