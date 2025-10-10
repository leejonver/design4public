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
  },
  // API 라우트 설정
  api: {
    bodyParser: {
      sizeLimit: '10mb', // API 요청 본문 크기 제한
    },
    responseLimit: '10mb',
  },
  // Serverless Function 설정
  experimental: {
    // API 라우트에서 큰 파일 처리 지원
    isrMemoryCacheSize: 0,
  },
};

module.exports = nextConfig;
