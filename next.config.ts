import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('./server')
    return config
  },
};

export default nextConfig;
