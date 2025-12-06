// app/api/tracks/[trackId]/reviews/[reviewId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  updateTrackReview,
  deleteTrackReview,
  ValidationError,
} from "lib/services/reviewService";

type Params = { trackId: string; reviewId: string };

export async function PUT(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { trackId: trackIdParam, reviewId: reviewIdParam } =
      await context.params;

    const trackId = parseInt(trackIdParam, 10);
    const reviewId = parseInt(reviewIdParam, 10);

    const body = await req.json();
    const { rating, comment } = body;

    const updated = await updateTrackReview(
      trackId,
      reviewId,
      rating,
      comment
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("[reviews][PUT][Error]", err);
    if (err instanceof ValidationError) {
      const status =
        err.message === "Review not found." ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: err.message ?? "Error updating review." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { trackId: trackIdParam, reviewId: reviewIdParam } =
      await context.params;

    const trackId = parseInt(trackIdParam, 10);
    const reviewId = parseInt(reviewIdParam, 10);

    await deleteTrackReview(trackId, reviewId);

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error("[reviews][DELETE][Error]", err);
    if (err instanceof ValidationError) {
      const status =
        err.message === "Review not found." ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: err.message ?? "Error deleting review." },
      { status: 500 }
    );
  }
}
