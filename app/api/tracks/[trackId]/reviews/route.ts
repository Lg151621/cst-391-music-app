import { NextRequest, NextResponse } from "next/server";
import { getPool } from "lib/db";

// GET /api/tracks/:trackId/reviews
// Returns all visible reviews for a specific track,
// plus the average rating and total review count.
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ trackId: string }> }
) {
  try {
    // Wait for the dynamic route params, then grab trackId as a string
    const { trackId: trackIdParam } = await context.params;

    // Convert the trackId from string (URL) to a number
    const trackId = parseInt(trackIdParam, 10);

    // If trackId isn’t a valid number, return a 400 Bad Request
    if (Number.isNaN(trackId)) {
      return NextResponse.json(
        { error: "Invalid trackId parameter." },
        { status: 400 }
      );
    }

    // Get a connection to the PostgreSQL pool
    const db = getPool();

    // 1) Query: fetch all non-hidden reviews for this track,
    // ordered by newest first
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
      WHERE track_id = $1 AND is_hidden = FALSE
      ORDER BY created_at DESC
      `,
      [trackId] // $1 = trackId
    );

    // 2) Query: compute the average rating and total number of reviews
    const summaryResult = await db.query(
      `
      SELECT
        COALESCE(AVG(rating), 0) AS average_rating,
        COUNT(*) AS total_reviews
      FROM reviews
      WHERE track_id = $1 AND is_hidden = FALSE
      `,
      [trackId]
    );

    // Get the single summary row (average + count)
    const summaryRow = summaryResult.rows[0];

    // Build the JSON response object that the frontend (or Postman)
    // will receive
    return NextResponse.json(
      {
        trackId,
        averageRating: Number(summaryRow.average_rating),
        totalReviews: Number(summaryRow.total_reviews),
        reviews: reviewsResult.rows, // full list of review rows
      },
      { status: 200 }
    );
  } catch (err: any) {
    // Log the error on the server for debugging
    console.error("[reviews][GET][Error]", err);

    // Return a generic 500 error to the client
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
