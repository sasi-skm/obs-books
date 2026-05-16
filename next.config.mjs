/** @type {import('next').NextConfig} */

// CSP origins used by this site:
//   - Supabase: REST/auth/realtime (https + wss) on the project subdomain
//   - Tawk.to: live-chat widget script (embed.tawk.to) plus its CDN / API origins
//   - Google Fonts: next/font/google proxies font files through Next.js at
//     build time, so fonts are self-hosted at runtime — no external font CSP needed.
//   - Stripe / PayPal: all calls are server-to-server (no browser-side SDK loaded).
//   - Telegram: server-side only (lib/telegram.ts), never touches the browser.
//
// NOTE: After deploying, do a quick browser smoke-test on a real page and the
// admin dashboard to confirm no CSP violations appear in DevTools console.
// Tawk.to in particular may load additional sub-origins at runtime; add them
// to 'script-src' / 'connect-src' if you see blocked-resource errors.

const isDev = process.env.NODE_ENV !== 'production'

const CSP_DIRECTIVES = [
  // Only allow framing from same origin (belt-and-suspenders with X-Frame-Options: DENY)
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for its inline <script> tags and JSON-LD.
  // 'unsafe-eval' is added in dev only (hot reload / React DevTools need it).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://embed.tawk.to https://*.tawk.to`,
  // Styles: Next.js injects inline <style> tags; Tawk may too.
  "style-src 'self' 'unsafe-inline' https://*.tawk.to",
  // Images: self + data URIs (for inline SVG/blobs) + Supabase storage
  "img-src 'self' data: blob: https://*.supabase.co https://*.tawk.to",
  // Fonts: Next.js self-hosts Google Fonts at build time so no external font origin needed
  "font-src 'self' data: https://*.tawk.to",
  // Fetch / XHR / WebSocket connections
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tawk.to wss://*.tawk.to${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
  // Tawk.to chat widget is embedded in an iframe from their domain
  "frame-src https://*.tawk.to",
  // Tawk loads workers for offline/push
  "worker-src blob: https://*.tawk.to",
  // Media: allow self (for any future audio/video)
  "media-src 'self'",
  // Object/embed: none
  "object-src 'none'",
  // Block mixed content
  "upgrade-insecure-requests",
].join('; ')

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
          { key: 'Content-Security-Policy', value: CSP_DIRECTIVES },
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
