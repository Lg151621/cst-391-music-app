import { NextRequest, NextResponse } from "next/server";
import { getPool } from 'lib/db';

// fetch tracks for one or more albums
async function attachTracksToAlbums(albums: any[], db: any) {
  const albumIds = albums.map((album) => album.id);
  if (albumIds.length === 0) return albums;

  const tracksResult = await db.query(
    "SELECT * FROM tracks WHERE album_id = ANY($1::int[])",
    [albumIds]
  );

  const tracksByAlbum: Record<number, any[]> = {};
  tracksResult.rows.forEach((track: any) => {
    if (!tracksByAlbum[track.album_id]) tracksByAlbum[track.album_id] = [];
    tracksByAlbum[track.album_id].push(track);
  });

  return albums.map((album) => ({
    ...album,
    tracks: tracksByAlbum[album.id] || [],
  }));
}

// ✅ GET /api/albums — or /api/albums?albumId=#
export async function GET(req: NextRequest) {
  try {
    const db = getPool();
    const url = new URL(req.url);
    const albumIdParam = url.searchParams.get("albumId");
    let albums;

    if (albumIdParam) {
      const albumId = parseInt(albumIdParam, 10);
      if (isNaN(albumId)) {
        return NextResponse.json({ error: "Invalid albumId" }, { status: 400 });
      }
      const result = await db.query("SELECT * FROM albums WHERE id = $1", [albumId]);
      albums = result.rows;
    } else {
      const result = await db.query("SELECT * FROM albums");
      albums = result.rows;
    }

    const albumsWithTracks = await attachTracksToAlbums(albums, db);
    return NextResponse.json(albumsWithTracks);
  } catch (error: any) {
    console.error("[albums][GET][Error]", error);
    return NextResponse.json(
      { error: "There was an error when fetching albums" },
      { status: 500 }
    );
  }
}

// ✅ POST /api/albums — Create album
export async function POST(req: NextRequest) {
  const db = getPool();
  const client = await db.connect();

  try {
    const body = await req.json();
    const { artist, title, year, description, image, tracks } = body;

    if (!artist || !title) {
      return NextResponse.json(
        { error: "artist and title are required" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const albumRes = await client.query(
      "INSERT INTO albums (artist, title, year, description, image) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [artist, title, year, description, image]
    );

    const albumId = albumRes.rows[0].id;

    // Insert any provided tracks
    if (Array.isArray(tracks)) {
      for (const track of tracks) {
        const { title, number, video_url, lyrics } = track;
        await client.query(
          "INSERT INTO tracks (album_id, title, number, video_url, lyrics) VALUES ($1, $2, $3, $4, $5)",
          [albumId, title, number, video_url, lyrics]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ albumId }, { status: 201 });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[albums][POST][Error]", err);
    return NextResponse.json(
      { error: "There was an error when creating album" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ✅ PUT /api/albums — Update album and its tracks
export async function PUT(req: NextRequest) {
  const db = getPool();
  const client = await db.connect();

  try {
    const body = await req.json();
    const { albumId, artist, title, year, description, tracks } = body;

    if (!albumId) {
      return NextResponse.json(
        { error: "albumId is required" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    await client.query(
      "UPDATE albums SET artist = $1, title = $2, year = $3, description = $4 WHERE id = $5",
      [artist, title, year, description, albumId]
    );

    if (Array.isArray(tracks)) {
      for (const track of tracks) {
        const { id, title, number, video_url, lyrics } = track;
        if (!id) continue;
        await client.query(
          "UPDATE tracks SET title = $1, number = $2, video_url = $3, lyrics = $4 WHERE id = $5 AND album_id = $6",
          [title, number, video_url, lyrics, id, albumId]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({
      message: `Album ${albumId} and tracks updated.`,
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[albums][PUT][Error]", err);
    return NextResponse.json(
      { error: "There was an error updating album." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
