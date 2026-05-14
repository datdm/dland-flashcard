import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Exclude backend packages from Next.js bundling
  outputFileTracingRoot: path.join(__dirname, "./"),
  outputFileTracingExcludes: {
    "*": ['./server/**/*', './server']
  },
  // Turbopack is enabled by default in Next.js 16
  turbopack: {},
};

export default nextConfig;
