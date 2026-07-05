import type { Metadata } from "next";
import { fetchItems, fetchCategories } from "@/lib/api";
import type { Category } from "@/lib/types";
import { createPageMetadata } from "@/lib/seo";
import { ItemsView } from "./items-view";

export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "아이템 · 오피스·공공가구 제품",
  description: "브랜드별 오피스 가구 아이템을 사양과 함께 살펴보세요.",
  path: "/items",
});

export default async function ItemsPage() {
  const [items, categories] = await Promise.all([fetchItems(), fetchCategories("item")]);
  return <ItemsView items={items} categories={categories.map((c: Category) => c.name)} count={items.length} />;
}
