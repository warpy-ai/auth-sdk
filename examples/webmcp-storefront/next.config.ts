import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The SDK is consumed from the repo root via a file: dependency, so it ships
  // as source-adjacent ESM rather than a prebuilt node_modules package.
  transpilePackages: ["@warpy-auth-sdk/core"],
};

export default nextConfig;
