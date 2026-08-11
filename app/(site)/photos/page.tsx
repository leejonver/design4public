import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/primitives";
import { PageHero } from "@/components/site/page-chrome";
import { PhotosView } from "@/components/site/photo-grid";
import { fetchPhotosPage } from "@/lib/api";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;
const PAGE_SIZE = 60;

export const metadata: Metadata = createPageMetadata({
  title: "포토 · 공공공간 가구 사진",
  description: "프로젝트와 아이템의 공간·가구 사진을 한눈에 둘러보세요.",
  path: "/photos",
});

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const { photos, total } = await fetchPhotosPage(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total > 0 && page > totalPages) notFound();

  return (
    <>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: "포토" }]}
        title="PHOTOS"
        count={total}
        lead="프로젝트와 아이템의 공간·가구 사진을 한눈에 둘러보세요."
      />
      <Container style={{ padding: "var(--sp-6) var(--gutter) var(--sp-9)" }}>
        <PhotosView photos={photos} />
        {totalPages > 1 ? (
          <nav
            aria-label="포토 페이지"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 16,
              marginTop: "var(--sp-7)",
            }}
          >
            {page > 1 ? (
              <Link
                href={page === 2 ? "/photos" : `/photos?page=${page - 1}`}
                className="d4p-button"
                data-variant="secondary"
                data-size="sm"
                style={{ justifySelf: "start" }}
              >
                ← 이전
              </Link>
            ) : (
              <span />
            )}
            <span
              aria-current="page"
              style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-sm)", color: "var(--ink-500)" }}
            >
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/photos?page=${page + 1}`}
                className="d4p-button"
                data-variant="secondary"
                data-size="sm"
                style={{ justifySelf: "end" }}
              >
                다음 →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Container>
    </>
  );
}
