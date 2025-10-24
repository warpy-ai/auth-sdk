import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@warpy-auth-sdk/core"],
};

export default nextConfig;
