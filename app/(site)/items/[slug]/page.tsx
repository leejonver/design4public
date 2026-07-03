import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Mail } from "lucide-react";
import { fetchItemBySlug } from "@/lib/api";
import type { ItemDetail } from "@/lib/types";
import { JsonLd } from "@/components/json-ld";
import { createPageMetadata, productSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/seo";
import { Container, Overline, SpecSheet } from "@/components/site/primitives";
import { Breadcrumb } from "@/components/site/page-chrome";
import { StickyTitle } from "@/components/site/sticky-title";
import { DetailHero } from "@/components/site/gallery";
import { ButtonLink } from "@/components/site/ui";
import { ContactButton } from "@/components/site/contact-modal";
import { ProjectCard } from "@/components/site/cards";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const item: ItemDetail | null = await fetchItemBySlug(params.slug);
  if (!item) return {};
  return createPageMetadata({
    title: item.name,
    description:
      item.description ??
      `${item.brandName ? `${item.brandName} ` : ""}${item.name} 오피스 가구 아이템 정보와 사양입니다.`,
    path: `/items/${params.slug}`,
    images: [item.image, ...item.gallery.map((g) => g.url)],
    type: "article",
  });
}

export default async function ItemDetailPage(props: Props) {
  const params = await props.params;
  const item: ItemDetail | null = await fetchItemBySlug(params.slug);
  if (!item) notFound();

  const jsonLd = jsonLdGraph([
    productSchema({
      name: item.name,
      description: item.description,
      images: [item.image, ...item.gallery.map((g) => g.url)],
      brand: item.brandName ?? item.brandNameEn,
      path: `/items/${item.slug}`,
    }),
    breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "아이템", path: "/items" },
      { name: item.name, path: `/items/${item.slug}` },
    ]),
  ]);

  const brandLabel = item.brandName ?? item.brandNameEn;
  const categoriesLabel = item.categories.join(" · ");
  const stickyMeta = [brandLabel, categoriesLabel].filter(Boolean).join(" · ");

  const specRows = [
    { label: "브랜드", value: brandLabel },
    { label: "분류", value: categoriesLabel },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  return (
    <div>
      <JsonLd data={jsonLd} />
      <StickyTitle
        title={item.name}
        meta={stickyMeta || undefined}
        threshold={300}
        actions={
          <ContactButton size="sm">문의하기</ContactButton>
        }
      />

      <Container style={{ padding: "var(--sp-5) var(--gutter) var(--sp-9)" }}>
        <div style={{ marginBottom: "var(--sp-5)" }}>
          <Breadcrumb
            items={[
              { label: "홈", href: "/" },
              { label: "아이템", href: "/items" },
              { label: item.name },
            ]}
          />
        </div>

        <div className="d4p-detail-split" style={{ alignItems: "start", gap: "var(--sp-8)" }}>
          <div>
            <DetailHero images={item.gallery} ratio="4 / 3" />
          </div>

          <div>
            {brandLabel &&
              (item.brandSlug ? (
                <Link href={`/brands/${item.brandSlug}`}>
                  <Overline>{brandLabel}</Overline>
                </Link>
              ) : (
                <Overline>{brandLabel}</Overline>
              ))}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "clamp(1.7rem,2.4vw,2.1rem)",
                letterSpacing: "-0.02em",
                color: "var(--ink-900)",
                margin: "12px 0 0",
              }}
            >
              {item.name}
            </h1>
            {categoriesLabel && (
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  color: "var(--ink-500)",
                  margin: "10px 0 0",
                }}
              >
                {categoriesLabel}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, margin: "24px 0 28px", flexWrap: "wrap" }}>
              <ContactButton variant="primary" iconLeft={<Mail size={16} strokeWidth={1.5} />}>
                문의하기
              </ContactButton>
              {item.naraUrl && (
                <ButtonLink
                  variant="secondary"
                  href={item.naraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  iconRight={<ExternalLink size={16} strokeWidth={1.5} />}
                >
                  나라장터에서 보기
                </ButtonLink>
              )}
            </div>

            <SpecSheet title="사양" rows={specRows} />
          </div>
        </div>

        {item.projects.length > 0 && (
          <div
            style={{
              marginTop: "var(--sp-8)",
              borderTop: "1px solid var(--border-hair)",
              paddingTop: "var(--sp-7)",
            }}
          >
            <Overline>Used in projects</Overline>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 20,
                margin: "8px 0 22px",
                color: "var(--ink-900)",
              }}
            >
              도입 프로젝트
            </h2>
            <div className="d4p-grid-3">
              {item.projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
