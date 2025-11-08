import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allow frontend origin
const allowedOrigin = "https://music-next-eight.vercel.app";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  // Only add headers for actual browser requests
  const res = NextResponse.next();

  if (origin === allowedOrigin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }

  // Always allow preflight + basic headers
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return res;
}

// Match all /api routes
export const config = {
  matcher: "/api/:path*",
};
