import "./globals.css";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/d4p/site-header";
import { SiteFooter } from "@/components/d4p/site-footer";
import { ContactModalProvider } from "@/components/d4p/contact-modal";
import { JsonLd } from "@/components/json-ld";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  jsonLdGraph,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";
import { fetchSearchIndex } from "@/lib/api";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "design4public | 공공조달 가구 납품사례",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const index = await fetchSearchIndex();

  return (
    <html lang="ko">
      <body className="min-h-screen">
        <JsonLd data={jsonLdGraph([organizationSchema(), websiteSchema()])} />
        <ContactModalProvider>
          <SiteHeader index={index} />
          <main style={{ minHeight: "60vh" }}>{children}</main>
          <SiteFooter />
        </ContactModalProvider>
      </body>
    </html>
  );
}
