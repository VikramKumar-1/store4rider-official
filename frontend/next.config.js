/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,  // Disable double-render in dev — makes everything 2x faster
  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,  // Cache optimized images for 30 days
    deviceSizes: [640, 750, 1080, 1200],   // Fewer breakpoints = fewer variants to generate
    imageSizes: [128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      }
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
};

export default nextConfig;
