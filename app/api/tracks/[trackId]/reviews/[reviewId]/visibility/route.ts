import { NextRequest, NextResponse } from "next/server";
import { getPool } from "lib/db";

// PUT /api/tracks/:trackId/reviews/:reviewId/visibility
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ trackId: string; reviewId: string }> }
) {
  try {
    const { trackId: trackIdParam, reviewId: reviewIdParam } =
      await context.params;

    const trackId = parseInt(trackIdParam, 10);
    const reviewId = parseInt(reviewIdParam, 10);

    if (Number.isNaN(trackId) || Number.isNaN(reviewId)) {
      return NextResponse.json(
        { error: "Invalid trackId or reviewId." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { is_hidden } = body;

    if (typeof is_hidden !== "boolean") {
      return NextResponse.json(
        { error: "is_hidden must be a boolean." },
        { status: 400 }
      );
    }

    const db = getPool();

    const result = await db.query(
      `
      UPDATE reviews
      SET
        is_hidden = $1,
        updated_at = NOW()
      WHERE id = $2 AND track_id = $3
      RETURNING
        id, track_id, user_id, rating, comment, is_hidden, created_at, updated_at
      `,
      [is_hidden, reviewId, trackId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err: any) {
    console.error("[visibility][PUT][Error]", err);
    return NextResponse.json(
      { error: err.message ?? "Error updating visibility." },
      { status: 500 }
    );
  }
}
