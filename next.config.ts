import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude server folder from Next.js compilation
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcrypt'],
  },
  webpack: (config) => {
    config.externals.push('./server')
    return config
  },
  turbopack: {
    // Empty config to acknowledge Turbopack usage
    // The server folder is already external and won't be bundled
  },
};

export default nextConfig;
