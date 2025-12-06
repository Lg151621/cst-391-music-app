// app/api/tracks/[trackId]/reviews/[reviewId]/visibility/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  updateTrackReviewVisibility,
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
    const { is_hidden } = body;

    const updated = await updateTrackReviewVisibility(
      trackId,
      reviewId,
      is_hidden
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("[visibility][PUT][Error]", err);
    if (err instanceof ValidationError) {
      const status =
        err.message === "Review not found." ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: err.message ?? "Error updating visibility." },
      { status: 500 }
    );
  }
}
