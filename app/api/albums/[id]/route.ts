import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db';

// ✅ Update an existing album by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const db = getPool()
  const client = await db.connect()

  try {
    const albumId = parseInt(params.id, 10)
    const body = await request.json()
    const { artist, title, year, description, image, tracks } = body

    if (!artist || !title) {
      return NextResponse.json({ error: 'Artist and title are required' }, { status: 400 })
    }

    await client.query('BEGIN')

    // ✅ Update main album info (includes image now)
    await client.query(
      `
      UPDATE albums
      SET artist = $1, title = $2, year = $3, description = $4, image = $5
      WHERE id = $6
      `,
      [artist, title, year, description, image, albumId]
    )

    // ✅ Safely handle tracks (update existing or insert new)
    if (Array.isArray(tracks) && tracks.length > 0) {
      for (const track of tracks) {
        const { id, title, number, video_url, lyrics } = track
        if (id) {
          await client.query(
            `
            UPDATE tracks
            SET title = $1, number = $2, video_url = $3, lyrics = $4
            WHERE id = $5 AND album_id = $6
            `,
            [title, number, video_url, lyrics, id, albumId]
          )
        } else {
          await client.query(
            `
            INSERT INTO tracks (album_id, title, number, video_url, lyrics)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [albumId, title, number, video_url, lyrics]
          )
        }
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ message: `✅ Album ${albumId} updated successfully` })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[albums][PUT][Error]', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  } finally {
    client.release()
  }
}

// Helper: attach tracks to albums
async function attachTracksToAlbums(albums: any[], db: any) {
  const albumIds = albums.map(album => album.id)
  if (albumIds.length === 0) return albums

  const tracksResult = await db.query(
    'SELECT * FROM tracks WHERE album_id = ANY($1::int[])',
    [albumIds]
  )

  const tracksByAlbum: Record<number, any[]> = {}
  tracksResult.rows.forEach((track: any) => {
    if (!tracksByAlbum[track.album_id]) tracksByAlbum[track.album_id] = []
    tracksByAlbum[track.album_id].push(track)
  })

  return albums.map(album => ({
    ...album,
    tracks: tracksByAlbum[album.id] || []
  }))
}

// ✅ GET a single album by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getPool()
    const albumId = parseInt(params.id, 10)

    if (isNaN(albumId)) {
      return NextResponse.json({ error: 'Invalid album ID' }, { status: 400 })
    }

    const result = await db.query('SELECT * FROM albums WHERE id = $1', [albumId])
    const albumsWithTracks = await attachTracksToAlbums(result.rows, db)
    if (albumsWithTracks.length === 0) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    return NextResponse.json(albumsWithTracks[0]) // return single album
  } catch (err: any) {
    console.error('[albums/id][GET][Error]', err)
    return NextResponse.json({ error: 'Error fetching album' }, { status: 500 })
  }
}

// ✅ DELETE an album by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getPool()
    const albumId = parseInt(params.id, 10)

    if (isNaN(albumId)) {
      return NextResponse.json({ error: 'Album ID must be an integer.' }, { status: 400 })
    }

    const result = await db.query('DELETE FROM albums WHERE id = $1', [albumId])
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Album not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: `🗑️ Album ${albumId} deleted.` })
  } catch (err: any) {
    console.error('[albums/id][DELETE][Error]', err)
    return NextResponse.json({ error: 'Error deleting album.' }, { status: 500 })
  }
}
