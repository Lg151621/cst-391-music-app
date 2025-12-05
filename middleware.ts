// middleware.ts (BACKEND project: cst-391-music-app)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allow both local + Vercel frontend origins
const allowedOrigins = [
  "https://music-next-eight.vercel.app", // frontend production
  "http://localhost:3000",               // backend dev
  "http://localhost:3001",               // frontend dev
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "";

  // Only care about /api routes
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // ✅ Check if the origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }

  // ✅ Always add these headers
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // You don’t actually need credentials; you can drop this line
  // res.headers.set("Access-Control-Allow-Credentials", "true");

  // ✅ Handle OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: res.headers,
    });
  }

  return res;
}

// ✅ Apply to all /api routes
export const config = {
  matcher: "/api/:path*",
};
