import { NextRequest, NextResponse } from "next/server";

import { getPool } from 'lib/db';

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

    // 1) Return ALL reviews (including hidden)
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

    // 2) Summary ONLY on non-hidden reviews
    const summaryResult = await db.query(
      `
      SELECT
        COALESCE(AVG(rating), 0) AS average_rating,
        COUNT(*) AS total_reviews
      FROM reviews
      WHERE track_id = $1
        AND is_hidden = FALSE
      `,
      [trackId]
    );

    const summary = summaryResult.rows[0];

    return NextResponse.json(
      {
        trackId,
        averageRating: Number(summary.average_rating),
        totalReviews: Number(summary.total_reviews),
        reviews: reviewsResult.rows, // includes hidden + visible
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
