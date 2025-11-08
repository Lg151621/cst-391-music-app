import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/src/lib/db";

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
