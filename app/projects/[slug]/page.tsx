import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProjectBySlug } from "@/lib/api";
import { Container, Overline, SpecSheet } from "@/components/d4p/primitives";
import { Breadcrumb } from "@/components/d4p/page-chrome";
import { StickyTitle } from "@/components/d4p/sticky-title";
import { ProjectMasthead } from "@/components/d4p/project-masthead";
import { Gallery } from "@/components/d4p/gallery";
import { ItemCard } from "@/components/d4p/cards";
import { ContactButton } from "@/components/d4p/contact-modal";
import { createPageMetadata, compactText, truncateDescription } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await fetchProjectBySlug(params.slug);
  if (!project) return {};

  const description = truncateDescription(
    compactText(project.description, `${project.title} 공공조달 가구 납품 프로젝트 사례입니다.`)
  );

  return createPageMetadata({
    title: project.title,
    description,
    path: `/projects/${project.slug}`,
    images: [project.coverImage, project.gallery[0]?.url],
    type: "article",
  });
}

export default async function ProjectDetailPage({ params }: Props) {
  const project = await fetchProjectBySlug(params.slug);
  if (!project) notFound();

  const meta = [...project.categories, project.year, project.location]
    .filter(Boolean)
    .join(" · ");

  const specRows = [
    { label: "용도", value: project.categories.join(" · ") || "-" },
    { label: "위치", value: project.location ?? "-" },
    { label: "발주", value: project.client ?? "-" },
    {
      label: "면적",
      value: project.area != null ? `${project.area.toLocaleString()}㎡` : "-",
    },
    { label: "준공", value: project.year != null ? String(project.year) : "-" },
    { label: "사진", value: `${project.imageCount}장` },
  ];

  return (
    <Container style={{ padding: "var(--sp-5) var(--gutter) var(--sp-9)" }}>
      <div style={{ marginBottom: "var(--sp-5)" }}>
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "프로젝트", href: "/projects" },
            { label: project.title },
          ]}
        />
      </div>

      <StickyTitle
        title={project.title}
        meta={meta}
        threshold={360}
        actions={
          <ContactButton size="sm" projectSlug={project.slug}>
            문의하기
          </ContactButton>
        }
      />

      <div style={{ marginBottom: "var(--sp-8)" }}>
        <ProjectMasthead project={project} />
      </div>

      <div
        className="d4p-detail-split"
        style={{
          marginBottom: "var(--sp-8)",
          borderTop: "1px solid var(--border-hair)",
          paddingTop: "var(--sp-7)",
        }}
      >
        <div>
          <Overline>Overview</Overline>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              lineHeight: 1.7,
              color: "var(--ink-700)",
              margin: "18px 0 0",
              maxWidth: "46ch",
            }}
          >
            {project.description}
          </p>
        </div>
        <SpecSheet title="개요" rows={specRows} />
      </div>

      <div style={{ marginBottom: "var(--sp-8)" }}>
        <Overline>Gallery</Overline>
        <div style={{ marginTop: 20 }}>
          <Gallery images={project.gallery} />
        </div>
      </div>

      {project.items.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 22,
            }}
          >
            <div>
              <Overline>Featured Items</Overline>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 20,
                  marginTop: 8,
                  color: "var(--ink-900)",
                }}
              >
                이 공간에 사용된 가구
              </h2>
            </div>
          </div>
          <div className="d4p-grid-4">
            {project.items.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
