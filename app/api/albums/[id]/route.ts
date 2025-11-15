import { NextRequest, NextResponse } from "next/server";
import { getPool } from "lib/db";

// In Next 15+ dynamic API routes, `params` is async and must be awaited.
type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────
// GET /api/albums/[id]  – fetch a single album (no tracks yet)
// ─────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;          // 👈 await params
  const albumId = Number(id);

  if (Number.isNaN(albumId)) {
    return NextResponse.json({ error: "Invalid album ID" }, { status: 400 });
  }

  try {
    const db = getPool();
    const { rows, rowCount } = await db.query(
      "SELECT * FROM albums WHERE id = $1",
      [albumId]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error("[albums/id][GET] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────
// PUT /api/albums/[id]  – update a single album row
// ─────────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;          // 👈 await params
  const albumId = Number(id);

  if (Number.isNaN(albumId)) {
    return NextResponse.json({ error: "Invalid album ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { artist, title, year, description, image } = body ?? {};

    if (!artist || !title) {
      return NextResponse.json(
        { error: "Artist and title are required" },
        { status: 400 }
      );
    }

    const parsedYear =
      year === null || year === undefined || year === "" ? null : Number(year);

    const db = getPool();
    const updateResult = await db.query(
      `
        UPDATE albums
           SET artist = $1,
               title = $2,
               year = $3,
               description = $4,
               image = $5
         WHERE id = $6
     RETURNING *
      `,
      [artist, title, parsedYear, description ?? "", image ?? "", albumId]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json(updateResult.rows[0]);
  } catch (err: any) {
    console.error("[albums/id][PUT][Error]", err);
    return NextResponse.json(
      { error: err?.message ?? "Update failed" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────
// DELETE /api/albums/[id]  – delete a single album
// ─────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;          // 👈 await params
  const albumId = Number(id);

  if (Number.isNaN(albumId)) {
    return NextResponse.json(
      { error: "Album ID must be an integer." },
      { status: 400 }
    );
  }

  try {
    const db = getPool();
    const result = await db.query("DELETE FROM albums WHERE id = $1", [albumId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Album not found." }, { status: 404 });
    }

    return NextResponse.json({ message: `🗑️ Album ${albumId} deleted.` });
  } catch (err: any) {
    console.error("[albums/id][DELETE][Error]", err);
    return NextResponse.json(
      { error: err?.message ?? "Error deleting album." },
      { status: 500 }
    );
  }
}
