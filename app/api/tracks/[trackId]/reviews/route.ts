// src/app/api/tracks/[trackId]/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "lib/db";

// GET /api/tracks/:trackId/reviews
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId: trackIdParam } = await context.params;
    const trackId = parseInt(trackIdParam, 10);

    if (Number.isNaN(trackId)) {
      return NextResponse.json(
        { error: "Invalid trackId parameter." },
        { status: 400 }
      );
    }

    const db = getPool();

    // 1) Return ALL reviews for this track (hidden + non-hidden)
    const reviewsResult = await db.query(
      `
      SELECT
        id,
        track_id,
        user_id,
        rating,
        comment,
        is_hidden,
        created_at,
        updated_at
      FROM reviews
      WHERE track_id = $1
      ORDER BY created_at DESC
      `,
      [trackId]
    );

    // 2) Summary based only on non-hidden reviews
    const summaryResult = await db.query(
      `
      SELECT
        COALESCE(
          AVG(rating) FILTER (WHERE is_hidden = FALSE),
          0
        ) AS average_rating,
        COUNT(*) FILTER (WHERE is_hidden = FALSE) AS total_reviews
      FROM reviews
      WHERE track_id = $1
      `,
      [trackId]
    );

    const summaryRow = summaryResult.rows[0];

    return NextResponse.json(
      {
        trackId,
        averageRating: Number(summaryRow.average_rating),
        totalReviews: Number(summaryRow.total_reviews),
        reviews: reviewsResult.rows,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[reviews][GET][Error]", err);
    return NextResponse.json(
      { error: err.message ?? "Error fetching reviews." },
      { status: 500 }
    );
  }
}

// POST /api/tracks/:trackId/reviews
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId: trackIdParam } = await context.params;
    const trackId = parseInt(trackIdParam, 10);

    if (Number.isNaN(trackId)) {
      return NextResponse.json(
        { error: "Invalid trackId parameter." },
        { status: 400 }
      );
    }

    const { rating, comment } = await req.json();

    // basic validation
    if (
      rating === undefined ||
      rating === null ||
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
      INSERT INTO reviews (track_id, user_id, rating, comment)
      VALUES ($1, NULL, $2, $3)
      RETURNING
        id,
        track_id,
        user_id,
        rating,
        comment,
        is_hidden,
        created_at,
        updated_at
      `,
      [trackId, rating, comment ?? null]
    );

    const created = result.rows[0];

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("[reviews][POST][Error]", err);
    return NextResponse.json(
      { error: err.message ?? "Error creating review." },
      { status: 500 }
    );
  }
}
