import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'

// GET /api/artists - Retrieve a list of all distinct artists
export async function GET() {
  try {
    const db = getPool()
    // Query albums table for distinct artist names
    const result = await db.query('SELECT DISTINCT artist FROM albums ORDER BY artist')
    const artists = result.rows.map((row: any) => row.artist)
    return NextResponse.json(artists)
  } catch (err: any) {
    console.error('[artists][GET][Error] ', err)
    return NextResponse.json({ error: 'There was an error when fetching artists' }, { status: 500 })
  }
}

// POST /api/tracks - Create a new track
export async function POST(request: Request) {
  try {
    const db = getPool()
    const { album_id, title, number, video_url, lyrics } = await request.json()
    // Only require what's actually needed by your schema
    if (!album_id || !title || !number) {
      return NextResponse.json({ error: 'album_id, title, and number required' }, { status: 400 })
    }
    await db.query(
      'INSERT INTO tracks (album_id, title, number, video_url, lyrics) VALUES ($1, $2, $3, $4, $5)',
      [album_id, title, number, video_url, lyrics]
    )
    return NextResponse.json({ message: `Track "${title}" added` }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}
