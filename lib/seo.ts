import type { Metadata } from "next";

export const SITE_URL = "https://www.design4public.com";
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

/** Strip cache-busters and drop empties — JSON-LD image URLs should be canonical. */
function schemaImages(images: Array<string | null | undefined>): string[] | undefined {
  const urls = images
    .map(stripCacheBuster)
    .filter((u): u is string => Boolean(u));
  return urls.length > 0 ? urls : undefined;
}

export function articleSchema({
  headline,
  description,
  images = [],
  datePublished,
  dateModified,
  path,
}: {
  headline: string;
  description: string | null;
  images?: Array<string | null | undefined>;
  datePublished?: string;
  dateModified?: string;
  path: string;
}) {
  return {
    "@type": "Article",
    headline,
    description: description ?? undefined,
    image: schemaImages(images),
    datePublished,
    dateModified,
    mainEntityOfPage: absoluteUrl(path),
    inLanguage: "ko-KR",
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function productSchema({
  name,
  description,
  images = [],
  brand,
  path,
}: {
  name: string;
  description: string | null;
  images?: Array<string | null | undefined>;
  brand: string | null;
  path: string;
}) {
  // No `offers` / `aggregateRating`: public-procurement reference pages, no price.
  return {
    "@type": "Product",
    name,
    description: description ?? undefined,
    image: schemaImages(images),
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    url: absoluteUrl(path),
  };
}

export function brandSchema({
  name,
  nameEn,
  description,
  logo,
  website,
  path,
}: {
  name: string;
  nameEn: string | null;
  description: string | null;
  logo: string | null;
  website: string | null;
  path: string;
}) {
  return {
    "@type": "Brand",
    name,
    alternateName: nameEn ?? undefined,
    description: description ?? undefined,
    logo: stripCacheBuster(logo),
    url: absoluteUrl(path),
    sameAs: website ? [website] : undefined,
  };
}

export function imageObjectSchema({
  url,
  caption,
  description,
  representativeOfPage,
}: {
  url: string;
  caption: string | null;
  description?: string | null;
  representativeOfPage?: boolean;
}) {
  const clean = stripCacheBuster(url)!;
  return {
    "@type": "ImageObject",
    contentUrl: clean,
    url: clean,
    caption: caption ?? undefined,
    description: description ?? undefined,
    representativeOfPage: representativeOfPage || undefined,
  };
}

export function jsonLdGraph(graph: unknown[]) {
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
