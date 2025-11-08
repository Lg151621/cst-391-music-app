import { NextResponse } from "next/server";
import { getPool } from 'lib/db';

// ✅ GET /api/artists - Retrieve all distinct artists
export async function GET() {
  try {
    const db = getPool();
    const result = await db.query(
      "SELECT DISTINCT artist FROM albums ORDER BY artist"
    );
    const artists = result.rows.map((row: any) => row.artist);
    return NextResponse.json(artists);
  } catch (err: any) {
    console.error("[artists][GET][Error]", err);
    return NextResponse.json(
      { error: "There was an error when fetching artists." },
      { status: 500 }
    );
  }
}
