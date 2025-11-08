import { NextResponse } from "next/server";
import { getPool } from 'lib/db';

export async function GET() {
  const environment = process.env.NODE_ENV;
  const dbUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  try {
    const db = getPool();

    // Check basic connectivity
    const nowResult = await db.query("SELECT NOW() as now");
    const now = nowResult.rows[0]?.now;

    // Example query to verify album data exists
    const artistResult = await db.query("SELECT artist FROM albums LIMIT 1");
    const artist = artistResult.rows[0]?.artist ?? "No artists found";

    return NextResponse.json({
      time: now,
      artist,
      message: `Godinez Database connection successful. Running in ${environment}. DATABASE_URL: ${dbUrl}`,
    });
  } catch (err: any) {
    console.error("[db-check][Error]", err);
    return NextResponse.json(
      {
        error: "Database connection failed",
        details: err.message ?? String(err),
        message: `Godinez Database connection failed. Running in ${environment}. DATABASE_URL: ${dbUrl}`,
      },
      { status: 500 }
    );
  }
}
