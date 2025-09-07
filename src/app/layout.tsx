import type { Metadata } from "next";
import ClientLayout from '@/components/ClientLayout';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import "./globals.css";

export const metadata: Metadata = {
  title: "Design4Public 콘텐츠관리자",
  description: "공공조달 가구 납품 프로젝트 사례 CMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 폰트 로드 */}
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <ConfigProvider
          theme={{
            token: {
              fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
          }}
          locale={{
            locale: 'ko_KR',
          }}
        >
          <ClientLayout>
            {children}
          </ClientLayout>
        </ConfigProvider>
      </body>
    </html>
  );
}
