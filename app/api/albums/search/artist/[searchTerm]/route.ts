import { NextRequest, NextResponse } from "next/server";
import { getPool } from 'lib/db';

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

export async function GET(req: NextRequest, context: any) {
  try {
    const db = getPool();
    const searchTerm = context.params.searchTerm;

    if (!searchTerm || searchTerm.trim() === "") {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 }
      );
    }

    const pattern = `%${searchTerm}%`;
    const result = await db.query(
      "SELECT * FROM albums WHERE artist ILIKE $1 ORDER BY artist, title",
      [pattern]
    );

    const albumsWithTracks = await attachTracksToAlbums(result.rows, db);
    return NextResponse.json(albumsWithTracks);
  } catch (err: any) {
    console.error("[search/artist][GET][Error]", err);
    return NextResponse.json(
      { error: "There was an error searching albums by artist." },
      { status: 500 }
    );
  }
}
