/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  async redirects() {
    return [
      // Legacy CMS host → unified admin (M7 cutover).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'cms.design4public.com' }],
        destination: 'https://www.design4public.com/admin',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
