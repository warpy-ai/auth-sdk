/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    turbopack: {
      // Set the workspace root to silence lockfile warning
      root: __dirname,
    },
  },
};

module.exports = nextConfig;
