import { Suspense } from "react";
import type { Metadata } from "next";
import { ItemsFilter } from "./items-filter";
import { ItemsList } from "./items-list";
import { ItemsSkeleton } from "./items-skeleton";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Items",
  description: "공공조달 가구 제품 카탈로그를 브랜드, 태그, 키워드로 탐색하고 프로젝트 적용 사례까지 함께 확인해 보세요.",
  path: "/items",
});

export default function ItemsListPage() {
  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Page Header */}
      <header className="space-y-3">
        <h1 className="text-display-sm lg:text-display-md font-semibold text-neutral-900">Items</h1>
        <p className="text-neutral-600 text-base lg:text-lg max-w-2xl">
          공공조달 가구 제품 카탈로그를 탐색해 보세요
        </p>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-3 xl:col-span-2">
          <div className="lg:sticky lg:top-28">
            <ItemsFilter />
          </div>
        </aside>

        {/* Items Grid */}
        <section className="lg:col-span-9 xl:col-span-10">
          <Suspense fallback={<ItemsSkeleton />}>
            <ItemsList />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
