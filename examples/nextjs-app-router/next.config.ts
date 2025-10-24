/**
 * Next.js 16 Configuration
 *
 * Leveraging Next.js 16 features:
 * - Cache Components for session caching
 * - Turbopack for faster builds
 * - Enhanced routing optimizations
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable Cache Components (Next.js 16)
  // Allows use of "use cache" directive for optimized caching
  cacheComponents: true,

  // Experimental features
  experimental: {
    // Enable Turbopack for development (default in Next.js 16)
    turbo: {
      // Enable filesystem caching for faster rebuilds
      memoryLimit: 1024 * 1024 * 512, // 512MB
    },

    // Partial Pre-Rendering (PPR) - works with Cache Components
    ppr: true,

    // Enable React 19.2 features
    reactCompiler: true,
  },

  // TypeScript configuration
  typescript: {
    // Type checking during build
    ignoreBuildErrors: false,
  },

  // Enable strict mode for better error detection
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Configure headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Enable compression
  compress: true,

  // Power mode for optimized production builds
  productionBrowserSourceMaps: false,

  // Redirect configuration
  async redirects() {
    return [
      // Redirect /auth to /login
      {
        source: '/auth',
        destination: '/login',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
