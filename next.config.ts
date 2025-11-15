// next.config.ts
import type { NextConfig } from "next";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://cst-391-music-app.vercel.app";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx"],

  async rewrites() {
    // In development, DO NOT rewrite /api — let Next handle its own API routes.
    if (process.env.NODE_ENV === "development") {
      return [];
    }

    // In production, if you truly need to proxy to a separate backend, keep this:
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_BASE}/api/:path*`,
      },
    ];
  },

  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
