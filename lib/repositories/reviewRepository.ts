// src/lib/repositories/reviewRepository.ts
import { getPool } from "lib/db";

export type ReviewRow = {
  id: number;
  track_id: number;
  user_id: number | null;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

// --- READ ---

export async function getReviewsByTrackId(
  trackId: number
): Promise<ReviewRow[]> {
  const db = getPool();
  const result = await db.query(
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
  return result.rows;
}

export async function getReviewSummaryByTrackId(trackId: number): Promise<{
  averageRating: number;
  totalReviews: number;
}> {
  const db = getPool();
  const result = await db.query(
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

  const row = result.rows[0];
  return {
    averageRating: Number(row.average_rating),
    totalReviews: Number(row.total_reviews),
  };
}

// --- CREATE ---

export async function insertReview(
  trackId: number,
  rating: number,
  comment: string | null
): Promise<ReviewRow> {
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
    [trackId, rating, comment]
  );
  return result.rows[0];
}

// --- UPDATE (rating/comment) ---

export async function updateReview(
  trackId: number,
  reviewId: number,
  rating: number,
  comment: string | null
): Promise<ReviewRow | null> {
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
      id,
      track_id,
      user_id,
      rating,
      comment,
      is_hidden,
      created_at,
      updated_at
    `,
    [rating, comment, reviewId, trackId]
  );

  return result.rows[0] ?? null;
}

// --- UPDATE (visibility) ---

export async function updateReviewVisibility(
  trackId: number,
  reviewId: number,
  isHidden: boolean
): Promise<ReviewRow | null> {
  const db = getPool();
  const result = await db.query(
    `
    UPDATE reviews
    SET
      is_hidden = $1,
      updated_at = NOW()
    WHERE id = $2 AND track_id = $3
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
    [isHidden, reviewId, trackId]
  );

  return result.rows[0] ?? null;
}

// --- DELETE ---

export async function deleteReview(
  trackId: number,
  reviewId: number
): Promise<boolean> {
  const db = getPool();
  const result = await db.query(
    `
    DELETE FROM reviews
    WHERE id = $1 AND track_id = $2
    RETURNING id
    `,
    [reviewId, trackId]
  );

  return result.rows.length > 0;
}
