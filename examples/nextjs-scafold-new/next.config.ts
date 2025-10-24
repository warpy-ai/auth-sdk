import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@auth-sdk/core"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
