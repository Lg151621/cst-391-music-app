import { NextRequest, NextResponse } from "next/server";
import { getPool } from "lib/db";

// GET /api/tracks/:trackId
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId: trackIdParam } = await context.params;
    const trackId = parseInt(trackIdParam, 10);

    if (Number.isNaN(trackId)) {
      return NextResponse.json(
        { error: "Invalid track id." },
        { status: 400 }
      );
    }

    const db = getPool();

    const result = await db.query(
      `
      SELECT
        id,
        album_id,
        title,
        number,
        video_url,
        lyrics
      FROM tracks
      WHERE id = $1
      `,
      [trackId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Track not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err: unknown) {
    console.error("[tracks/:trackId][GET][Error]", err);
    const message =
      err instanceof Error ? err.message : "Error fetching track.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
