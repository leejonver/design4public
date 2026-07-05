/** @type {import('next').NextConfig} */
const remotePatterns = [
  {
    protocol: 'https',
    hostname: '**.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
];

// Local Supabase storage serves images over http from 127.0.0.1:54321 (E2E /
// local dev only). Production images come from `**.supabase.co`, so this host
// is never present in a production build.
if (process.env.NODE_ENV !== 'production') {
  remotePatterns.push({
    protocol: 'http',
    hostname: '127.0.0.1',
    port: '54321',
    pathname: '/storage/v1/object/public/**',
  });
}

const nextConfig = {
  images: {
    remotePatterns,
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
