import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "@/components/admin/ClientLayout";

export const metadata: Metadata = {
  title: "Design4Public 콘텐츠관리자",
  description: "공공조달 가구 납품 프로젝트 사례 CMS",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
