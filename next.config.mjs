/** @type {import('next').NextConfig} */
const remotePatterns = [
  {
    protocol: 'https',
    hostname: '**.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
];

// Local development and isolated E2E builds allow their local Storage endpoint.
if (process.env.NODE_ENV !== 'production' || process.env.E2E === '1') {
  const localStorage = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321');
  if (['127.0.0.1', 'localhost'].includes(localStorage.hostname)) {
    remotePatterns.push({
      protocol: 'http',
      hostname: localStorage.hostname,
      port: localStorage.port,
      pathname: '/storage/v1/object/public/**',
    });
  }
}

const nextConfig = {
  distDir: process.env.E2E === '1' ? '.next-e2e' : '.next',
  images: {
    remotePatterns,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    // 75 = default; 90 = hero / detail stages (Next 16 requires listing every quality used)
    qualities: [75, 90],
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
