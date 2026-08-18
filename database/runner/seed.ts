import fs from "node:fs/promises";
import path from "node:path";

import { pool } from "./db";

async function getSeedFiles(): Promise<string[]> {
  const seedsDir = path.resolve(process.cwd(), "seeds");

  const files = await fs.readdir(seedsDir);

  return files
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

async function runSeedFile(
  client: Awaited<ReturnType<typeof pool.connect>>,
  filename: string,
): Promise<void> {
  const seedsDir = path.resolve(process.cwd(), "seeds");
  const filePath = path.join(seedsDir, filename);

  const sql = await fs.readFile(filePath, "utf8");

  await client.query(sql);

  console.log(`✓ Seeded ${filename}`);
}

async function seed(): Promise<void> {
  console.log("Starting database seed...\n");

  const client = await pool.connect();

  try {
    const seedFiles = await getSeedFiles();

    if (seedFiles.length === 0) {
      console.log("No seed files found.");
      return;
    }

    console.log(`Found ${seedFiles.length} seed file(s).\n`);

    for (const file of seedFiles) {
      await runSeedFile(client, file);
    }

    console.log("\nDatabase seed completed successfully.");
  } catch (error) {
    console.error("\nDatabase seed failed.");

    console.error(error);

    process.exitCode = 1;
  } finally {
    client.release();

    await pool.end();
  }
}

seed();
