import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'

// Helper to fetch tracks for one or more albums
async function attachTracksToAlbums(albums: any[], db: any) {
  // Collect all album ids into a list
  const albumIds = albums.map(album => album.id)
  if (albumIds.length === 0) return albums

  // Fetch all tracks for these album ids in one query
  const tracksResult = await db.query(
    'SELECT * FROM tracks WHERE album_id = ANY($1::int[])',
    [albumIds]
  )
  // Group tracks by album_id
  const tracksByAlbum: { [key: number]: any[] } = {}
  tracksResult.rows.forEach((track: any) => {
    if (!tracksByAlbum[track.album_id]) tracksByAlbum[track.album_id] = []
    tracksByAlbum[track.album_id].push(track)
  })

  // Attach grouped tracks to each album object
  return albums.map(album => ({       ...album,
    tracks: tracksByAlbum[album.id] || []
  }))
}

// GET /api/albums?albumId=... or all
export async function GET(request: Request) {
  try {
    const db = getPool()
    const url = new URL(request.url)
    const albumIdParam = url.searchParams.get('albumId')
    let albums

    if (albumIdParam) {
      const albumId = parseInt(albumIdParam, 10)
      if (isNaN(albumId)) {
        return NextResponse.json({ error: 'Invalid albumId' }, { status: 400 })
      }
      const result = await db.query('SELECT * FROM albums WHERE id = $1', [albumId])
      albums = result.rows
    } else {
      const result = await db.query('SELECT * FROM albums')
      albums = result.rows
    }

    const albumsWithTracks = await attachTracksToAlbums(albums, db)
    return NextResponse.json(albumsWithTracks)
  } catch (error: any) {
    console.error('[albums][GET][Error]', error)
    return NextResponse.json({ error: 'There was an error when fetching albums' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const db = getPool()
  const client = await db.connect()

  try {
    const body = await request.json()
    const { artist, title, year, description, image, tracks } = body   // ✅ include image

    if (!artist || !title) {
      return NextResponse.json({ error: 'artist and title are required' }, { status: 400 })
    }

    await client.query('BEGIN')

    const albumRes = await client.query(
      // ✅ add image to your INSERT statement
      'INSERT INTO albums (artist, title, year, description, image) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [artist, title, year, description, image]   // ✅ include as 5th parameter
    )

    const albumId = albumRes.rows[0].id

    // ✅ Insert each provided track for this album (no change)
    if (Array.isArray(tracks)) {
      for (const track of tracks) {
        const { title, number, video_url, lyrics } = track
        await client.query(
          'INSERT INTO tracks (album_id, title, number, video_url, lyrics) VALUES ($1, $2, $3, $4, $5)',
          [albumId, title, number, video_url, lyrics]
        )
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ albumId }, { status: 201 })

  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('[albums][POST][Error]', err)
    return NextResponse.json({ error: 'There was an error when creating album' }, { status: 500 })
  } finally {
    client.release()
  }
}

// Updates an album and its tracks
export async function PUT(request: Request) {
  const db = getPool()
  const client = await db.connect()
  try {
    const body = await request.json()
    const { albumId, artist, title, year, description, tracks } = body
    if (!albumId) {
      return NextResponse.json({ error: 'albumId is required' }, { status: 400 })
    }
    await client.query('BEGIN')

    // Update the album fields
    await client.query(
      'UPDATE albums SET artist = $1, title = $2, year = $3, description = $4 WHERE id = $5',
      [artist, title, year, description, albumId]
    )

    // Loop and update each track (by its id)
    if (Array.isArray(tracks)) {
      for (const track of tracks) {
        const { id, title, number, video_url, lyrics } = track
        if (!id) continue // Only update tracks with valid id
        await client.query(
          'UPDATE tracks SET title = $1, number = $2, video_url = $3, lyrics = $4 WHERE id = $5 AND album_id = $6',
          [title, number, video_url, lyrics, id, albumId]
        )
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ message: `Album ${albumId} and tracks updated.` })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('[albums][PUT][Error]', err)
    return NextResponse.json({ error: 'There was an error updating album.' }, { status: 500 })
  } finally {
    client.release()
  }
}
