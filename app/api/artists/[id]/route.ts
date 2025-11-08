import { NextResponse } from 'next/server'
import { getPool } from '../../../../lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const trackId = parseInt(params.id, 10)
    if (isNaN(trackId)) {
      return NextResponse.json({ error: 'Invalid track ID' }, { status: 400 })
    }

    const db = getPool()
    // Query the tracks table for the full track info
    const result = await db.query('SELECT * FROM tracks WHERE id = $1', [trackId])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}
