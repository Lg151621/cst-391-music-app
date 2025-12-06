// app/api/tracks/[trackId]/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getTrackReviews,
  createTrackReview,
  ValidationError,
} from "lib/services/reviewService";

type Params = { trackId: string };

export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { trackId: trackIdParam } = await context.params;
    const trackId = parseInt(trackIdParam, 10);

    const data = await getTrackReviews(trackId);

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("[reviews][GET][Error]", err);
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err.message ?? "Error fetching reviews." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { trackId: trackIdParam } = await context.params;
    const trackId = parseInt(trackIdParam, 10);

    const body = await req.json();
    const { rating, comment } = body;

    const created = await createTrackReview(trackId, rating, comment);

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("[reviews][POST][Error]", err);
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err.message ?? "Error creating review." },
      { status: 500 }
    );
  }
}
