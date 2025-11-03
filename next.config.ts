import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable fast refresh for better development experience
  reactStrictMode: true,
  // Optimize package imports for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
