import type { Metadata } from "next";

export const SITE_URL = "https://design4public.com";
export const SITE_NAME = "design4public";
export const SITE_DESCRIPTION =
  "공공조달 가구 납품사례와 제품, 브랜드 정보를 탐색하는 design4public 콘텐츠 사이트입니다.";
export const CONTACT_EMAIL = "d4p@design4public.com";
export const CONTACT_PHONE = "+82-31-599-2662";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function stripCacheBuster(url: string | null | undefined) {
  if (!url) return undefined;
  return url.split("?")[0];
}

export function compactText(value: string | null | undefined, fallback: string) {
  return (value ?? fallback).replace(/\s+/g, " ").trim();
}

export function truncateDescription(value: string, maxLength = 155) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function getSeoImages(images: Array<string | null | undefined>) {
  return images
    .map(stripCacheBuster)
    .filter((url): url is string => Boolean(url))
    .map((url) => ({
      url,
      width: 1200,
      height: 630,
    }));
}

export function createPageMetadata({
  title,
  description,
  path,
  images = [],
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  images?: Array<string | null | undefined>;
  type?: "website" | "article";
}): Metadata {
  const canonical = absoluteUrl(path);
  const seoImages = getSeoImages(images);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type,
      images: seoImages.length > 0 ? seoImages : undefined,
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: seoImages.map((image) => image.url),
    },
  };
}

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.svg"),
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE,
      areaServed: "KR",
      availableLanguage: ["ko"],
    },
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ko-KR",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function jsonLdGraph(graph: unknown[]) {
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
