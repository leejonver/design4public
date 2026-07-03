import "./globals.css";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ContactModalProvider } from "@/components/site/contact-modal";
import { JsonLd } from "@/components/json-ld";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  jsonLdGraph,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "design4public | 공공조달 가구 납품사례",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ContactModalProvider>
      <JsonLd data={jsonLdGraph([organizationSchema(), websiteSchema()])} />
      <SiteHeader />
      <main style={{ minHeight: "60vh" }}>{children}</main>
      <SiteFooter />
    </ContactModalProvider>
  );
}
