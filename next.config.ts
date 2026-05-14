import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcrypt']
  },
  webpack: (config) => {
    config.externals.push('./server')
    return config
  },
  turbopack: {
    
  }
};

export default nextConfig;
