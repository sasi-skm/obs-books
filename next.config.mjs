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
    // Report-Only by design; enforce in a later batch after reviewing violation
    // reports. Never switch to Content-Security-Policy without first confirming
    // zero violations in the report stream.
    //
    // Origins included and why:
    //   'self'                       - same-origin scripts, styles, fetches
    //   'unsafe-inline'              - Next.js inline scripts + Tailwind inline styles
    //   https://xquzachvmptvrmovvlgc.supabase.co - Supabase project (DB + storage)
    //   https://*.supabase.co        - Supabase CDN / auth
    //   https://js.stripe.com        - Stripe.js library (script-src)
    //   https://api.stripe.com       - Stripe API fetch (connect-src)
    //   https://*.stripe.com         - Stripe hosted payment pages (frame-src + connect)
    //   https://hooks.stripe.com     - Stripe webhook / element events (connect-src)
    //   https://embed.tawk.to        - Tawk.to chat widget script (TawktoChat.tsx)
    //   https://*.tawk.to            - Tawk.to CDN + frames + assets
    //   https://va.tawk.to           - Tawk.to visitor analytics
    //   wss://*.tawk.to              - Tawk.to WebSocket (live chat channel)
    //   data: blob:                  - canvas exports, blob URLs for file previews
    //   https:                       - img-src permissive for book covers served
    //                                  from arbitrary Supabase storage public URLs
    //
    // Note: next/font/google self-hosts font files via /_next/static, so no
    // external fonts.googleapis.com or fonts.gstatic.com entries are needed.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://embed.tawk.to https://*.tawk.to https://va.tawk.to",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https://xquzachvmptvrmovvlgc.supabase.co https://*.supabase.co https://api.stripe.com https://*.stripe.com https://hooks.stripe.com https://*.tawk.to https://va.tawk.to wss://*.tawk.to",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "frame-src https://*.stripe.com https://*.tawk.to",
      "worker-src 'self' blob:",
      "media-src 'self' blob: https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

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
          { key: 'Content-Security-Policy-Report-Only', value: csp },
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
      // The OBS /subscribe page (a dead Flower Letter waitlist duplicate) was
      // removed. OBS now points visitors to the real, separate Flower Letter
      // site. permanent:false (307) in case the page is ever revived here.
      {
        source: '/subscribe',
        destination: 'https://obsflowerletter.com',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
