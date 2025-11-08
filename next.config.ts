import type { NextConfig } from "next";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://cst-391-music-app.vercel.app";

/** */
const nextConfig: NextConfig = {
  // Ensure all common extensions are recognized
  pageExtensions: ["js", "jsx", "ts", "tsx"],

  // 🔁 Route rewriting for API proxying
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://localhost:3000/api/:path*"
            : `${BACKEND_BASE}/api/:path*`,
      },
    ];
  },

  // ⚡ Optional optimization settings (good defaults)
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
