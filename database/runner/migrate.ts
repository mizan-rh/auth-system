import fs from "node:fs/promises";
import path from "node:path";

import { pool } from "./db";

type Migration = {
  version: string;
  name: string;
  filename: string;
};

function parseMigrationFilename(filename: string): Migration {
  const match = filename.match(/^(\d+)_(.+)\.sql$/);

  if (!match) {
    throw new Error(
      `Invalid migration filename: ${filename}`,
    );
  }

  return {
    version: match[1],
    name: match[2],
    filename,
  };
}

async function getMigrationFiles(): Promise<Migration[]> {
  const migrationsDir = path.resolve(
    process.cwd(),
    "migrations",
  );

  const files = await fs.readdir(migrationsDir);

  return files
    .filter((file) => file.endsWith(".sql"))
    .map(parseMigrationFilename)
    .sort((a, b) => {
      return Number(a.version) - Number(b.version);
    });
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query(`
    SELECT version
    FROM schema_migrations
    ORDER BY version;
  `);

  return new Set(
    result.rows.map((row) => row.version),
  );
}

async function runMigration(migration: Migration) {
  const migrationsDir = path.resolve(
    process.cwd(),
    "migrations",
  );

  const filePath = path.join(
    migrationsDir,
    migration.filename,
  );

  const sql = await fs.readFile(filePath, "utf8");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(sql);

    await client.query(
      `
      INSERT INTO schema_migrations (
        version,
        name
      )
      VALUES ($1, $2);
      `,
      [migration.version, migration.name],
    );

    await client.query("COMMIT");

    console.log(
      `✓ Applied ${migration.filename}`,
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      `✗ Failed ${migration.filename}`,
    );

    throw error;
  } finally {
    client.release();
  }
}

async function migrate() {
  console.log("Starting database migration...\n");

  try {
    const migrations = await getMigrationFiles();

    if (migrations.length === 0) {
      console.log("No migration files found.");
      return;
    }

    const appliedMigrations =
      await getAppliedMigrations();

    const pendingMigrations = migrations.filter(
      (migration) =>
        !appliedMigrations.has(migration.version),
    );

    console.log(
      `Found ${migrations.length} migration(s).`,
    );

    if (pendingMigrations.length === 0) {
      console.log("\nNo pending migrations.");
      return;
    }

    console.log(
      `Found ${pendingMigrations.length} pending migration(s).\n`,
    );

    for (const migration of pendingMigrations) {
      console.log(
        `Applying ${migration.filename}...`,
      );

      await runMigration(migration);
    }

    console.log(
      "\nDatabase migration completed successfully.",
    );
  } catch (error) {
    console.error(
      "\nDatabase migration failed.",
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();