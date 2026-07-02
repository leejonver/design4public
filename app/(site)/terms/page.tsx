import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "이용약관",
  description: "본 약관은 DESIGN4PUBLIC 서비스 이용에 관한 기본적인 사항을 규정합니다.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
