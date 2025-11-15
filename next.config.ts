import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return []; 
  },
};

export default nextConfig;
