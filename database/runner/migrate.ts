import fs from "node:fs/promises";
import path from "node:path";

const migrationsDir = path.resolve(
  process.cwd(),
  "migrations",
);

const files = await fs.readdir(migrationsDir);

const migrationFiles = files
  .filter((file) => file.endsWith(".sql"))
  .sort();

console.log(migrationFiles);