import { NextRequest, NextResponse } from "next/server";
import { getPool } from "lib/db";

// GET /api/tracks
// GET /api/tracks?albumId=1  -> tracks for a specific album
export async function GET(req: NextRequest) {
  try {
    const db = getPool();
    const { searchParams } = new URL(req.url);
    const albumIdParam = searchParams.get("albumId");

    let result;

    if (albumIdParam) {
      const albumId = parseInt(albumIdParam, 10);

      if (Number.isNaN(albumId)) {
        return NextResponse.json(
          { error: "albumId must be a number." },
          { status: 400 }
        );
      }

      result = await db.query(
        `
        SELECT
          id,
          album_id,
          title,
          number,
          video_url,
          lyrics
        FROM tracks
        WHERE album_id = $1
        ORDER BY number ASC
        `,
        [albumId]
      );
    } else {
      // optional: all tracks
      result = await db.query(
        `
        SELECT
          id,
          album_id,
          title,
          number,
          video_url,
          lyrics
        FROM tracks
        ORDER BY id ASC
        `
      );
    }

    return NextResponse.json(result.rows, { status: 200 });
  } catch (err: any) {
    console.error("[tracks][GET][Error]", err);
    return NextResponse.json(
      { error: err.message ?? "Error fetching tracks." },
      { status: 500 }
    );
  }
}
// POST /api/tracks - Create a new track
export async function POST(req: NextRequest) {
  try {
    const db = getPool();
    const { album_id, title, number, video_url, lyrics } = await req.json();

    if (!album_id || !title || !number) {
      return NextResponse.json(
        { error: "album_id, title, and number are required." },
        { status: 400 }
      );
    }

    await db.query(
      "INSERT INTO tracks (album_id, title, number, video_url, lyrics) VALUES ($1, $2, $3, $4, $5)",
      [album_id, title, number, video_url, lyrics]
    );

    return NextResponse.json(
      { message: `Track "${title}" added successfully.` },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[tracks][POST][Error]", err);
    return NextResponse.json(
      { error: err.message ?? "Error creating track." },
      { status: 500 }
    );
  }
}