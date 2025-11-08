import { NextRequest, NextResponse } from "next/server";
import { getPool } from 'lib/db';

export async function GET(req: NextRequest, context: any) {
  try {
    const { id } = context.params;
    const trackId = parseInt(id, 10);

    if (isNaN(trackId)) {
      return NextResponse.json({ error: "Invalid track ID" }, { status: 400 });
    }

    const db = getPool();
    const result = await db.query("SELECT * FROM tracks WHERE id = $1", [trackId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    console.error("[tracks/id][GET][Error]", err);
    return NextResponse.json(
      { error: err.message ?? "Error fetching track" },
      { status: 500 }
    );
  }
}
