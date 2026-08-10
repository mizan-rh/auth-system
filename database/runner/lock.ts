import { PoolClient } from "pg";

import { pool } from "./db";

const MIGRATION_LOCK_ID = 748392;

let lockClient: PoolClient | null = null;

export async function acquireMigrationLock(): Promise<void> {
    lockClient = await pool.connect();

    await lockClient.query(
        "SELECT pg_advisory_lock($1);",
        [MIGRATION_LOCK_ID],
    );

    console.log("✓ Migration lock acquired.");
}

export async function releaseMigrationLock(): Promise<void> {
    if (!lockClient) {
        return;
    }

    try {
        await lockClient.query(
            "SELECT pg_advisory_unlock($1);",
            [MIGRATION_LOCK_ID],
        );

        console.log("✓ Migration lock released.");
    } finally {
        lockClient.release();
        lockClient = null;
    }
}