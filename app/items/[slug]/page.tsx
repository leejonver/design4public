import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { fetchItemBySlug, fetchItemPhotos } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { addCacheBuster } from "@/lib/utils";
import { ExternalLink, Mail } from "lucide-react";
import {
  SITE_URL,
  absoluteUrl,
  breadcrumbSchema,
  compactText,
  createPageMetadata,
  jsonLdGraph,
  stripCacheBuster,
  truncateDescription,
} from "@/lib/seo";

export const revalidate = 0; // 항상 최신 데이터 가져오기

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchItemBySlug(decodeURIComponent(slug));
  if (!item) return {};
  const decodedSlug = decodeURIComponent(slug);
  const description = truncateDescription(
    compactText(item.description, `${item.name} 공공조달 가구 제품 정보와 적용 프로젝트 사례입니다.`)
  );
  const metadata = createPageMetadata({
    title: item.name,
    description,
    path: `/items/${decodedSlug}`,
    images: [item.image_url],
  });

  if (item.status === "hidden") {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}

export default async function ItemDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await fetchItemBySlug(decodeURIComponent(slug));
  if (!item) return notFound();
  const decodedSlug = decodeURIComponent(slug);

  // Fetch photos that contain this item
  type ItemPhoto = {
    id: string;
    image_url: string;
    alt_text: string | null;
    title: string | null;
    project: { id: string; slug: string; title: string; status: string };
  };
  const itemPhotos: ItemPhoto[] = await fetchItemPhotos(item.id);

  type RelatedProject = {
    id: string;
    slug: string;
    title: string;
    cover_image_url: string | null;
    year: number | null;
    area?: number | null;
    project_images?: { id: string; image_url: string; order: number }[];
  };

  const relatedProjects: RelatedProject[] = item.project_items
    .map((pi: { project_id: string; projects: RelatedProject | null }) => {
      if (!pi.projects) return null;
      const coverImage = pi.projects.cover_image_url ?? pi.projects.project_images?.[0]?.image_url ?? null;
      return {
        ...pi.projects,
        cover_image_url: coverImage,
      };
    })
    .filter((project: RelatedProject | null): project is RelatedProject => Boolean(project));

  const tags = item.item_tags
    ?.map((tag: { tags: { name: string; type?: string } | null }) =>
      tag.tags?.type === "item" ? tag.tags?.name : undefined
    )
    .filter((name: string | undefined): name is string => Boolean(name));
  const description = truncateDescription(
    compactText(item.description, `${item.name} 공공조달 가구 제품 정보와 적용 프로젝트 사례입니다.`)
  );

  return (
    <article className="space-y-10">
      <JsonLd
        data={jsonLdGraph([
          breadcrumbSchema([
            { name: "Items", path: "/items" },
            { name: item.name, path: `/items/${decodedSlug}` },
          ]),
          {
            "@type": "Product",
            "@id": `${absoluteUrl(`/items/${decodedSlug}`)}#product`,
            url: absoluteUrl(`/items/${decodedSlug}`),
            name: item.name,
            description,
            image: stripCacheBuster(item.image_url),
            brand: item.brands
              ? {
                  "@type": "Brand",
                  name: item.brands.name_ko,
                  alternateName: item.brands.name_en ?? undefined,
                  url: absoluteUrl(`/brands/${item.brands.slug}`),
                }
              : undefined,
            category: "공공조달 가구",
            keywords: tags,
            offers: item.nara_url
              ? {
                  "@type": "Offer",
                  url: item.nara_url,
                  availability: "https://schema.org/InStock",
                  seller: {
                    "@id": `${SITE_URL}/#organization`,
                  },
                }
              : undefined,
          },
        ])}
      />
      {/* 카탈로그 레이아웃 - 이미지 + 정보 */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* 좌측: 제품 이미지 */}
        <div className="lg:w-1/2 space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={addCacheBuster(item.image_url)}
              alt={item.name}
              fill
              priority
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* 추가 이미지가 있다면 썸네일로 표시 (현재는 1개만 있음) */}
          {/* 향후 item_images 테이블이 추가되면 여기에 썸네일 갤러리 표시 */}
        </div>

        {/* 우측: 제품 정보 */}
        <div className="lg:w-1/2 space-y-6">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">{item.name}</h1>

            {item.brands && (
              <p className="text-lg">
                <span className="text-muted-foreground">from </span>
                <Link
                  href={`/brands/${item.brands.slug}`}
                  className="text-sage-600 hover:text-sage-700 hover:underline font-medium"
                >
                  {item.brands.name_ko}
                  {item.brands.name_en && (
                    <span className="text-muted-foreground ml-1">({item.brands.name_en})</span>
                  )}
                </Link>
              </p>
            )}
          </header>

          {/* CTA 버튼들 */}
          <div className="flex flex-wrap gap-3">
            {item.nara_url && (
              <a href={item.nara_url} target="_blank" rel="noopener noreferrer">
                <Button className="bg-sage-600 hover:bg-sage-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  제품 사이트 방문
                </Button>
              </a>
            )}
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              견적 / 문의하기
            </Button>
          </div>

          {/* 제품 설명 */}
          {item.description && (
            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* 태그 */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <Badge key={tag} variant="muted">#{tag}</Badge>
              ))}
            </div>
          )}

          {/* 브랜드 정보 */}
          {item.brands?.website_url && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>LEARN MORE:</strong>{" "}
                <a
                  href={item.brands.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sage-600 hover:underline"
                >
                  {item.brands.website_url}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 해당 아이템이 포함된 프로젝트 사진들 */}
      {itemPhotos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            이 아이템이 포함된 사진
            <span className="text-muted-foreground font-normal ml-2">({itemPhotos.length})</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {itemPhotos.map((photo) => (
              <Link
                key={photo.id}
                href={`/projects/${photo.project.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100"
              >
                <Image
                  src={addCacheBuster(photo.image_url)}
                  alt={photo.alt_text || photo.project.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium truncate">
                      {photo.project.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 연관 프로젝트 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">아이템이 사용된 프로젝트</h2>
        {relatedProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
                  {project.cover_image_url && (
                    <Image
                      src={addCacheBuster(project.cover_image_url)}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                </div>
                <div className="mt-3">
                  <h3 className="font-medium group-hover:text-sage-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {project.year ?? "연도 미정"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <p className="text-muted-foreground">아직 연관된 프로젝트가 없습니다.</p>
          </div>
        )}
      </section>
    </article>
  );
}
