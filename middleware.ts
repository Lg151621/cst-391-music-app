import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allow both local + Vercel frontend origins
const allowedOrigins = [
  "https://music-next-eight.vercel.app", //  your frontend production domain
  "http://localhost:3000",               //  backend dev
  "http://localhost:3001",               //  frontend dev
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const res = NextResponse.next();

  // ✅ Check if the origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }

  // ✅ Always add these headers (for preflight and actual requests)
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");

  // ✅ Handle OPTIONS requests (preflight)
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

// ✅ Apply to all /api routes
export const config = {
  matcher: "/api/:path*",
};
