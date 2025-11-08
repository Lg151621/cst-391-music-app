import { Pool, PoolClient } from "pg";

// Keep a persistent connection pool across hot reloads (dev) and serverless invocations (prod)
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const URL = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (!URL) {
      throw new Error("POSTGRES_URL or DATABASE_URL not set");
    }

    pool = new Pool({
      connectionString: URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
      max: 5, // small pool for serverless environments
    });
  }
  return pool;
}

// helper to get a client with automatic cleanup
export async function getClient(): Promise<PoolClient> {
  const db = getPool();
  const client = await db.connect();
  return client;
}
