import { Pool } from "pg";

// Persist across hot reloads in dev and across warm serverless invocations
let pool;

export function getPool() {
  if (!pool) {
    const URL = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (!URL) throw new Error("POSTGRES_URL (or DATABASE_URL) not set");

    pool = new Pool({
      connectionString: URL,
      // TLS is required by many hosted PGs; harmless locally when undefined
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
      max: 5, // small pool suits serverless
    });
  }
  return pool;
}
