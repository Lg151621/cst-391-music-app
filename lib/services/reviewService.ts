// src/lib/services/reviewService.ts
import {
  getReviewsByTrackId,
  getReviewSummaryByTrackId,
  insertReview,
  updateReview,
  updateReviewVisibility,
  deleteReview,
  type ReviewRow,
} from "lib/repositories/reviewRepository";

export class ValidationError extends Error {}

// In the future you can pass role/email in here.
// For now we keep behavior the same as your original routes.

export async function getTrackReviews(trackId: number): Promise<{
  trackId: number;
  averageRating: number;
  totalReviews: number;
  reviews: ReviewRow[];
}> {
  if (Number.isNaN(trackId)) {
    throw new ValidationError("Invalid trackId parameter.");
  }

  const [reviews, summary] = await Promise.all([
    getReviewsByTrackId(trackId),
    getReviewSummaryByTrackId(trackId),
  ]);

  return {
    trackId,
    averageRating: summary.averageRating,
    totalReviews: summary.totalReviews,
    reviews,
  };
}

export async function createTrackReview(
  trackId: number,
  rating: unknown,
  comment: unknown
): Promise<ReviewRow> {
  if (Number.isNaN(trackId)) {
    throw new ValidationError("Invalid trackId parameter.");
  }

  const numericRating = Number(rating);

  if (
    rating === undefined ||
    rating === null ||
    Number.isNaN(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new ValidationError("rating must be an integer between 1 and 5.");
  }

  return insertReview(trackId, numericRating, (comment as string) ?? null);
}

export async function updateTrackReview(
  trackId: number,
  reviewId: number,
  rating: unknown,
  comment: unknown
): Promise<ReviewRow> {
  if (Number.isNaN(trackId) || Number.isNaN(reviewId)) {
    throw new ValidationError("Invalid trackId or reviewId.");
  }

  const numericRating = Number(rating);

  if (
    rating === undefined ||
    Number.isNaN(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new ValidationError("rating must be an integer between 1 and 5.");
  }

  const updated = await updateReview(
    trackId,
    reviewId,
    numericRating,
    (comment as string) ?? null
  );

  if (!updated) {
    throw new ValidationError("Review not found.");
  }

  return updated;
}

export async function updateTrackReviewVisibility(
  trackId: number,
  reviewId: number,
  isHidden: unknown
): Promise<ReviewRow> {
  if (Number.isNaN(trackId) || Number.isNaN(reviewId)) {
    throw new ValidationError("Invalid trackId or reviewId.");
  }

  if (typeof isHidden !== "boolean") {
    throw new ValidationError("is_hidden must be a boolean.");
  }

  const updated = await updateReviewVisibility(trackId, reviewId, isHidden);

  if (!updated) {
    throw new ValidationError("Review not found.");
  }

  return updated;
}

export async function deleteTrackReview(
  trackId: number,
  reviewId: number
): Promise<void> {
  if (Number.isNaN(trackId) || Number.isNaN(reviewId)) {
    throw new ValidationError("Invalid trackId or reviewId.");
  }

  const deleted = await deleteReview(trackId, reviewId);

  if (!deleted) {
    throw new ValidationError("Review not found.");
  }
}
