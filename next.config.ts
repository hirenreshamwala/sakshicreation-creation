import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  images: { unoptimized: false },
  compress: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: false }, 
  typescript: { ignoreBuildErrors: true }, 
  pageExtensions: ["tsx", "ts", "jsx", "js"],
  experimental: { optimizePackageImports: ["@mui/material"] }
};

export default nextConfig;
