import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { fetchPhotoById } from "@/lib/api";
import { Container, Overline, Badge } from "@/components/site/primitives";
import { Breadcrumb } from "@/components/site/page-chrome";
import { ItemCard } from "@/components/site/cards";
import { JsonLd } from "@/components/json-ld";
import {
  createPageMetadata,
  compactText,
  truncateDescription,
  imageObjectSchema,
  breadcrumbSchema,
  jsonLdGraph,
} from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

function photoTitle(p: { title: string | null; alt: string | null; projectTitle: string | null }) {
  return p.title ?? p.alt ?? p.projectTitle ?? "사진";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const photo = await fetchPhotoById(id);
  if (!photo) return {};
  const title = photoTitle(photo);
  const description = truncateDescription(
    compactText(
      photo.description ?? photo.alt,
      `${photo.projectTitle ?? "design4public"} 프로젝트의 공간·가구 사진입니다.`
    )
  );
  return createPageMetadata({
    title,
    description,
    path: `/photos/${photo.id}`,
    images: [photo.url],
    type: "article",
  });
}

export default async function PhotoDetailPage({ params }: Props) {
  const { id } = await params;
  const photo = await fetchPhotoById(id);
  if (!photo) notFound();

  const title = photoTitle(photo);
  const badges = [...photo.projectCategories, photo.year, photo.location].filter(Boolean) as (
    | string
    | number
  )[];

  const jsonLd = jsonLdGraph([
    imageObjectSchema({
      url: photo.url,
      caption: title,
      description: photo.description ?? photo.alt,
      representativeOfPage: true,
    }),
    breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "포토", path: "/photos" },
      { name: title, path: `/photos/${photo.id}` },
    ]),
  ]);

  return (
    <Container style={{ padding: "var(--sp-5) var(--gutter) var(--sp-9)" }}>
      <JsonLd data={jsonLd} />

      <div style={{ marginBottom: "var(--sp-5)" }}>
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "포토", href: "/photos" },
            { label: title },
          ]}
        />
      </div>

      <div className="d4p-detail-split" style={{ alignItems: "start", gap: "var(--sp-8)" }}>
        <div className="d4p-photo-tile" style={{ aspectRatio: "4 / 3" }}>
          {photo.url && (
            <Image
              src={photo.url}
              alt={photo.alt ?? title}
              fill
              sizes="(max-width:860px) 100vw, 60vw"
              priority
              style={{ objectFit: "cover" }}
            />
          )}
        </div>

        <div>
          <Overline>Photo</Overline>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "clamp(1.8125rem,2.4vw,2.25rem)",
              letterSpacing: "-0.02em",
              color: "var(--ink-900)",
              margin: "12px 0 0",
            }}
          >
            {title}
          </h1>

          {photo.description && (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 17.5,
                lineHeight: 1.7,
                color: "var(--ink-700)",
                margin: "16px 0 0",
                maxWidth: "46ch",
              }}
            >
              {photo.description}
            </p>
          )}

          {badges.length > 0 && (
            <div style={{ display: "flex", gap: 8, margin: "18px 0 0", flexWrap: "wrap" }}>
              {badges.map((b, idx) => (
                <Badge key={idx}>{b}</Badge>
              ))}
            </div>
          )}

          {photo.projectSlug && (
            <Link href={`/projects/${photo.projectSlug}`} className="d4p-side-link" style={{ marginTop: 24 }}>
              <div>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-400)" }}>
                  프로젝트
                </span>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--ink-900)",
                    marginTop: 3,
                  }}
                >
                  {photo.projectTitle}
                </div>
              </div>
              <ArrowRight size={18} strokeWidth={1.5} style={{ color: "var(--ink-400)", flex: "none" }} />
            </Link>
          )}
        </div>
      </div>

      {photo.items.length > 0 && (
        <div
          style={{
            marginTop: "var(--sp-8)",
            borderTop: "1px solid var(--border-hair)",
            paddingTop: "var(--sp-7)",
          }}
        >
          <Overline>Featured Items</Overline>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 22,
              margin: "8px 0 22px",
              color: "var(--ink-900)",
            }}
          >
            이 사진 속 가구
          </h2>
          <div className="d4p-grid-4">
            {photo.items.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
