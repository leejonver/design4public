import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { fetchBrands, fetchProjects } from "@/lib/api";
import { addCacheBuster } from "@/lib/utils";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Brands",
  description: "공공조달 가구 브랜드별 제품과 납품 프로젝트 사례를 한곳에서 살펴보세요.",
  path: "/brands",
});
export const revalidate = 0;

export default async function BrandsPage() {
  const [brands, projects] = await Promise.all([fetchBrands(), fetchProjects()]);

  const getCount = (brandId: string) =>
    projects.filter((project: any) =>
      project.project_items.some((item: any) => item.items?.brands?.id === brandId)
    ).length;

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Page Header */}
      <header className="space-y-3">
        <h1 className="text-display-sm lg:text-display-md font-semibold text-neutral-900">Brands</h1>
        <p className="text-neutral-600 text-base lg:text-lg max-w-2xl">
          공공조달 가구 브랜드를 탐색해 보세요
        </p>
      </header>

      {/* Brands Grid - Smaller cards for 4K */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 3xl:grid-cols-8 4xl:grid-cols-10 gap-4 lg:gap-6">
        {brands.map((brand: any) => {
          const projectCount = getCount(brand.id);
          const logoUrl = brand.logo_image_url ?? brand.cover_image_url;

          return (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group block"
            >
              {/* Logo Container */}
              <div className="relative aspect-square overflow-hidden bg-neutral-50 rounded-lg border border-neutral-200 transition-all duration-300 group-hover:border-neutral-300 group-hover:shadow-md">
                {logoUrl ? (
                  <Image
                    src={addCacheBuster(logoUrl)}
                    alt={brand.name_ko ?? brand.name_en ?? "브랜드"}
                    fill
                    className="object-contain p-4 lg:p-6 transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 150px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-neutral-300">
                      {brand.name_ko?.charAt(0) ?? brand.name_en?.charAt(0) ?? "B"}
                    </span>
                  </div>
                )}
              </div>

              {/* Brand Info */}
              <div className="mt-3 space-y-1">
                <h3 className="text-sm font-medium text-neutral-900 group-hover:text-sage-700 transition-colors line-clamp-1">
                  {brand.name_ko}
                </h3>
                {brand.name_en && (
                  <p className="text-xs text-neutral-500 line-clamp-1">
                    {brand.name_en}
                  </p>
                )}
                {projectCount > 0 && (
                  <p className="text-xs text-neutral-400">
                    프로젝트 {projectCount}건
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
