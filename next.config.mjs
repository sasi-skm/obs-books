/** @type {import('next').NextConfig} */
const nextConfig = {
  staticPageGenerationTimeout: 120,
  images: {
    // unoptimized: true bypasses Vercel's Image Optimization service.
    // On the Hobby plan, the monthly quota of optimized image transforms
    // is limited; once exceeded, every optimizer request returns HTTP 402
    // (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) and product photos break
    // site-wide. Serving the originals straight from Supabase storage is
    // slightly heavier on bandwidth but always works and costs nothing.
    // Supabase already resizes uploads to 1600px max so originals are a
    // reasonable size (~150-400 KB each).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/category/tea-country',
        destination: '/category/country-life',
        permanent: true,
      },
      {
        source: '/category/art-nature',
        destination: '/category/art-illustration',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
