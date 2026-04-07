/** @type {import('next').NextConfig} */
const nextConfig = {
  staticPageGenerationTimeout: 120,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
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
