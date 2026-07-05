import type { Metadata } from "next";
import { fetchBrands } from "@/lib/api";
import { createPageMetadata } from "@/lib/seo";
import { BrandsView } from "./brands-view";

export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "브랜드 · 가구 제조사",
  description: "국내외 오피스 가구 브랜드를 한곳에서.",
  path: "/brands",
});

export default async function BrandsPage() {
  const brands = await fetchBrands();
  return <BrandsView brands={brands} count={brands.length} />;
}
