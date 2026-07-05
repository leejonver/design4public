import type { Metadata } from "next";
import { Container } from "@/components/site/primitives";
import { PageHero } from "@/components/site/page-chrome";
import { PhotosView } from "@/components/site/photo-grid";
import { fetchCategories, fetchPhotos } from "@/lib/api";
import type { Category } from "@/lib/types";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "포토 · 공공공간 가구 사진",
  description: "프로젝트에서 촬영된 공간·가구 사진을 한눈에 둘러보세요.",
  path: "/photos",
});

export default async function PhotosPage() {
  const [photos, categories] = await Promise.all([fetchPhotos(), fetchCategories("project")]);

  return (
    <>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: "포토" }]}
        title="PHOTOS"
        count={photos.length}
        lead="프로젝트에서 촬영된 공간·가구 사진을 한눈에 둘러보세요."
      />
      <Container style={{ padding: "var(--sp-6) var(--gutter) var(--sp-9)" }}>
        <PhotosView photos={photos} categories={categories.map((c: Category) => c.name)} />
      </Container>
    </>
  );
}
