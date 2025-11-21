import { NextRequest, NextResponse } from "next/server";
import { getPool } from "lib/db";

// PUT /api/tracks/:trackId/reviews/:reviewId
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

    const { rating, comment } = await req.json();

    // Validate rating
    if (
      rating === undefined ||
      Number.isNaN(Number(rating)) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5." },
        { status: 400 }
      );
    }

    const db = getPool();

    const result = await db.query(
      `
      UPDATE reviews
      SET
        rating = $1,
        comment = $2,
        updated_at = NOW()
      WHERE id = $3 AND track_id = $4
      RETURNING
        id, track_id, user_id, rating, comment, is_hidden, created_at, updated_at
      `,
      [rating, comment ?? null, reviewId, trackId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err: any) {
    console.error("[reviews][PUT][Error]", err);
    return NextResponse.json(
      { error: err.message ?? "Error updating review." },
      { status: 500 }
    );
  }
}

// DELETE /api/tracks/:trackId/reviews/:reviewId
export async function DELETE(
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

    const db = getPool();

    const result = await db.query(
      `
      DELETE FROM reviews
      WHERE id = $1 AND track_id = $2
      RETURNING id
      `,
      [reviewId, trackId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error("[reviews][DELETE][Error]", err);
    return NextResponse.json(
      { error: err.message ?? "Error deleting review." },
      { status: 500 }
    );
  }
}
