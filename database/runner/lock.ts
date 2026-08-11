import { PoolClient } from "pg";

import { pool } from "./db";

const MIGRATION_LOCK_ID = 748392;

const LOCK_TIMEOUT_MS = 10_000;
const LOCK_RETRY_INTERVAL_MS = 500;

let lockClient: PoolClient | null = null;

export async function acquireMigrationLock(): Promise<void> {
  const client = await pool.connect();

  try {
    const deadline =
      Date.now() + LOCK_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const result = await client.query<{
        locked: boolean;
      }>(
        `
        SELECT pg_try_advisory_lock($1) AS locked;
        `,
        [MIGRATION_LOCK_ID],
      );

      if (result.rows[0].locked) {
        lockClient = client;

        console.log(
          "✓ Migration lock acquired.",
        );

        return;
      }

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          LOCK_RETRY_INTERVAL_MS,
        ),
      );
    }

    throw new Error(
      `Could not acquire migration lock within ${
        LOCK_TIMEOUT_MS / 1000
      } seconds.`,
    );
  } catch (error) {
    client.release();

    throw error;
  }
}

export async function releaseMigrationLock(): Promise<void> {
  if (!lockClient) {
    return;
  }

  const client = lockClient;

  lockClient = null;

  try {
    await client.query(
      `
      SELECT pg_advisory_unlock($1);
      `,
      [MIGRATION_LOCK_ID],
    );

    console.log(
      "✓ Migration lock released.",
    );
  } finally {
    client.release();
  }
}