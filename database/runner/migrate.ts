import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  acquireMigrationLock,
  releaseMigrationLock,
} from "./lock";

import { pool } from "./db";

type Migration = {
  version: string;
  name: string;
  filename: string;
};

type AppliedMigration = {
  version: string;
  name: string;
  checksum: string | null;
};

function calculateChecksum(content: string): string {
  return crypto
    .createHash("sha256")
    .update(content, "utf8")
    .digest("hex");
}

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

function validateMigrationVersions(
  migrations: Migration[],
): void {
  const seenVersions = new Set<string>();

  for (const migration of migrations) {
    if (seenVersions.has(migration.version)) {
      throw new Error(
        `Duplicate migration version detected: ${migration.version}`,
      );
    }

    seenVersions.add(migration.version);
  }
}

function validateAppliedMigrations(
  migrations: Migration[],
  appliedMigrations: Map<
    string,
    AppliedMigration
  >,
): void {
  const migrationMap = new Map(
    migrations.map((migration) => [
      migration.version,
      migration,
    ]),
  );

  for (const applied of appliedMigrations.values()) {
    const migration = migrationMap.get(
      applied.version,
    );

    if (!migration) {
      throw new Error(
        `Migration file is missing for applied migration: ${applied.version}`,
      );
    }

    if (migration.name !== applied.name) {
      throw new Error(
        `Migration ${applied.version} name mismatch.\n` +
        `Applied: ${applied.name}\n` +
        `Current: ${migration.name}`,
      );
    }
  }
}

async function getAppliedMigrations(): Promise<Map<string, AppliedMigration>> {
  const result = await pool.query<AppliedMigration>(`
      SELECT version, name, checksum
      FROM schema_migrations
      ORDER BY version;
    `);

  return new Map(result.rows.map((row) => [row.version, row]));
}

async function verifyAppliedMigrations(
  migrations: Migration[],
  appliedMigrations: Map<string, AppliedMigration>,
): Promise<void> {
  const migrationsDir = path.resolve(
    process.cwd(),
    "migrations",
  );

  for (const migration of migrations) {
    const applied = appliedMigrations.get(
      migration.version,
    );

    if (!applied) {
      continue;
    }

    const filePath = path.join(
      migrationsDir,
      migration.filename,
    );

    const sql = await fs.readFile(
      filePath,
      "utf8",
    );

    const currentChecksum =
      calculateChecksum(sql);

    // Existing baseline migration
    // does not have a checksum yet.
    if (!applied.checksum) {
      await pool.query(
        `
        UPDATE schema_migrations
        SET checksum = $1
        WHERE version = $2;
        `,
        [currentChecksum, migration.version],
      );

      console.log(
        `✓ Checksum recorded for ${migration.filename}`,
      );

      continue;
    }

    if (applied.checksum !== currentChecksum) {
      throw new Error(
        `Migration ${migration.filename} has been modified after execution.\n` +
        `Expected checksum: ${applied.checksum}\n` +
        `Current checksum:  ${currentChecksum}`,
      );
    }
  }
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
  const checksum = calculateChecksum(sql);


  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(sql);

    await client.query(
      `
      INSERT INTO schema_migrations (
        version,
        name,
        checksum
      )
      VALUES ($1, $2, $3);
      `,
      [migration.version, migration.name, checksum],
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

  let lockAcquired = false;

  try {
    await acquireMigrationLock();
    lockAcquired = true;

    const migrations = await getMigrationFiles();

    if (migrations.length === 0) {
      console.log("No migration files found.");
      return;
    }

    validateMigrationVersions(migrations);

    const appliedMigrations =
      await getAppliedMigrations();

    validateAppliedMigrations(
      migrations,
      appliedMigrations,
    );

    await verifyAppliedMigrations(
      migrations,
      appliedMigrations,
    );

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
    if (lockAcquired) {
      await releaseMigrationLock();
    }

    await pool.end();
  }
}

migrate();