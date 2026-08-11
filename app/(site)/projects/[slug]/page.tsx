import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProjectBySlug } from "@/lib/api";
import { Container, Overline } from "@/components/site/primitives";
import { Breadcrumb } from "@/components/site/page-chrome";
import { StickyTitle } from "@/components/site/sticky-title";
import { ProjectMasthead } from "@/components/site/project-masthead";
import { Gallery } from "@/components/site/gallery";
import { ItemCard } from "@/components/site/cards";
import { ContactButton } from "@/components/site/contact-modal";
import { JsonLd } from "@/components/json-ld";
import {
  createPageMetadata, compactText, truncateDescription,
  articleSchema, imageObjectSchema, breadcrumbSchema, jsonLdGraph,
} from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);
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
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);
  if (!project) notFound();

  const galleryUrls = project.gallery.map((g) => g.url);
  const jsonLd = jsonLdGraph([
    articleSchema({
      headline: project.title,
      description: project.description,
      images: [project.coverImage, ...galleryUrls],
      dateModified: project.updatedAt,
      path: `/projects/${project.slug}`,
    }),
    ...project.gallery.map((g) =>
      imageObjectSchema({ url: g.url, caption: g.title ?? g.alt, description: null })
    ),
    breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "프로젝트", path: "/projects" },
      { name: project.title, path: `/projects/${project.slug}` },
    ]),
  ]);

  const meta = [...project.categories, project.year, project.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <Container style={{ padding: "var(--sp-5) var(--gutter) var(--sp-9)" }}>
      <JsonLd data={jsonLd} />
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
                  fontSize: "var(--fs-h4)",
                  marginTop: 8,
                  color: "var(--ink-900)",
                }}
              >
                이 공간에 사용된 가구
              </h2>
            </div>
          </div>
          <div className="d4p-related-items">
            {project.items.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
