import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude backend packages from Next.js bundling
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcrypt'],
  },
  // Turbopack is enabled by default in Next.js 16
  turbopack: {},
};

export default nextConfig;
