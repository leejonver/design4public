import type { Metadata } from "next";
import { LegalPage } from "@/components/d4p/legal";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "개인정보처리방침",
  description:
    "DESIGN4PUBLIC은 이용자의 개인정보를 중요하게 생각하며, 관련 법령에 따라 안전하게 관리합니다.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
