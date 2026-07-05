import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchBrandBySlug } from "@/lib/api";
import type { BrandDetail } from "@/lib/types";
import { JsonLd } from "@/components/json-ld";
import { createPageMetadata, brandSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/seo";
import { Container, Overline } from "@/components/site/primitives";
import { Breadcrumb } from "@/components/site/page-chrome";
import { StickyTitle } from "@/components/site/sticky-title";
import { ButtonLink } from "@/components/site/ui";
import { ContactButton } from "@/components/site/contact-modal";
import { ItemCard, ProjectCard } from "@/components/site/cards";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand: BrandDetail | null = await fetchBrandBySlug(slug);
  if (!brand) return {};
  return createPageMetadata({
    title: brand.nameKo,
    description:
      brand.description ??
      `${brand.nameKo}${brand.nameEn ? ` (${brand.nameEn})` : ""} 브랜드의 오피스 가구 아이템과 도입 프로젝트입니다.`,
    path: `/brands/${slug}`,
    images: [brand.cover, brand.logo],
    type: "article",
  });
}

const sectionHeading: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: 20,
  margin: "8px 0 22px",
  color: "var(--ink-900)",
};

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;
  const brand: BrandDetail | null = await fetchBrandBySlug(slug);
  if (!brand) notFound();

  const jsonLd = jsonLdGraph([
    brandSchema({
      name: brand.nameKo,
      nameEn: brand.nameEn,
      description: brand.description,
      logo: brand.logo,
      website: brand.website,
      path: `/brands/${brand.slug}`,
    }),
    breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "브랜드", path: "/brands" },
      { name: brand.nameKo, path: `/brands/${brand.slug}` },
    ]),
  ]);

  const stats: [number, string][] = [
    [brand.itemCount, "아이템"],
    [brand.projectCount, "프로젝트"],
  ];

  return (
    <div>
      <JsonLd data={jsonLd} />
      <StickyTitle
        title={brand.nameKo}
        meta={brand.nameEn ?? undefined}
        threshold={320}
        actions={<ContactButton size="sm">브랜드 문의</ContactButton>}
      />

      <Container style={{ padding: "var(--sp-5) var(--gutter) var(--sp-9)" }}>
        <div style={{ marginBottom: "var(--sp-5)" }}>
          <Breadcrumb
            items={[
              { label: "홈", href: "/" },
              { label: "브랜드", href: "/brands" },
              { label: brand.nameKo },
            ]}
          />
        </div>

        {/* Cover */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "var(--radius-sm)",
            aspectRatio: "21 / 9",
            background: "var(--ink-200)",
            marginBottom: "var(--sp-7)",
          }}
        >
          {brand.cover ? (
            <Image
              src={brand.cover}
              alt={brand.nameKo}
              fill
              sizes="100vw"
              priority
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--sunken)",
                color: "var(--ink-400)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "2rem",
              }}
            >
              {brand.nameKo.charAt(0) || "DESIGN4PUBLIC"}
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "var(--scrim-bottom)" }} />
          <div style={{ position: "absolute", left: "var(--sp-6)", bottom: "var(--sp-6)" }}>
            {brand.nameEn && (
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.74)",
                }}
              >
                {brand.nameEn}
              </div>
            )}
            <h1
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(2rem,4vw,3rem)",
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: "var(--white)",
                lineHeight: 1.05,
                marginTop: 8,
              }}
            >
              {brand.nameKo}
            </h1>
          </div>
        </div>

        {/* About + stats */}
        <div
          className="d4p-detail-split"
          style={{
            alignItems: "start",
            marginBottom: "var(--sp-8)",
            borderBottom: "1px solid var(--border-hair)",
            paddingBottom: "var(--sp-7)",
          }}
        >
          <div>
            <Overline>About</Overline>
            {brand.description && (
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "var(--ink-700)",
                  margin: "18px 0 0",
                  maxWidth: "48ch",
                }}
              >
                {brand.description}
              </p>
            )}
            {brand.website && (
              <div style={{ marginTop: 24 }}>
                <ButtonLink
                  variant="secondary"
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  웹사이트 방문
                </ButtonLink>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 40 }}>
            {stats.map(([n, l]) => (
              <div key={l}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 28,
                    color: "var(--ink-900)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {n.toLocaleString()}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    color: "var(--ink-500)",
                    marginTop: 3,
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        {brand.items.length > 0 && (
          <div style={{ marginBottom: "var(--sp-8)" }}>
            <Overline>Items</Overline>
            <h2 style={sectionHeading}>대표 아이템</h2>
            <div className="d4p-grid-4">
              {brand.items.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {brand.projects.length > 0 && (
          <div>
            <Overline>Projects</Overline>
            <h2 style={sectionHeading}>도입 프로젝트</h2>
            <div className="d4p-grid-3">
              {brand.projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
