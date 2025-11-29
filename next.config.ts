import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: { unoptimized: false },
  compress: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: false }, // Enable linting
  typescript: { ignoreBuildErrors: false }, // Fix TypeScript
  pageExtensions: ["tsx", "ts", "jsx", "js"],
  experimental: { optimizePackageImports: ["@mui/material"] }
};

export default nextConfig;
// 1. Fix next.config.ts to enable optimizations
