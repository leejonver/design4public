"use client";

import { useState } from "react";
import { Container } from "@/components/site/primitives";
import { PageHero, FilterBar } from "@/components/site/page-chrome";
import { FacetRow } from "@/components/site/list-controls";
import { ItemCard } from "@/components/site/cards";
import { FilterChip } from "@/components/site/ui";
import type { ItemSummary } from "@/lib/types";

export function ItemsView({
  items,
  categories,
  count,
}: {
  items: ItemSummary[];
  categories: string[];
  count: number;
}) {
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const brands = [...new Map(items.filter((it) => it.brandSlug).map((it) =>
    [it.brandSlug!, it.brandName ?? it.brandNameEn ?? it.brandSlug!],
  )).entries()];
  const brandItems = brand === null ? items : items.filter((it) => it.brandSlug === brand);
  const chips = ["All", ...categories.filter((c) => brandItems.some((it) => it.categories.includes(c)))];
  const filtered =
    category === "All" ? brandItems : brandItems.filter((it) => it.categories.includes(category));

  return (
    <div>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: "아이템" }]}
        title="ITEMS"
        count={brand === null && category === "All" ? count : filtered.length}
        lead="브랜드별 오피스 가구 아이템을 사양과 함께 살펴보세요."
      />
      <FilterBar
        left={
          <div className="d4p-item-filters">
            <button
              type="button"
              className="d4p-filter-chip d4p-item-filter-toggle"
              aria-expanded={filtersOpen}
              aria-controls="item-filter-options"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? "필터 접기" : "브랜드 · 카테고리 필터"}
              {!filtersOpen && (brand !== null || category !== "All") &&
                ` · ${[brands.find(([slug]) => slug === brand)?.[1], category !== "All" ? category : null].filter(Boolean).join(" / ")}`}
            </button>
            <div id="item-filter-options" className="d4p-item-filter-options" data-open={filtersOpen}>
              <div className="d4p-facet-row" role="group" aria-label="브랜드 필터">
                <FilterChip selected={brand === null} onClick={() => { setBrand(null); setCategory("All"); }}>All</FilterChip>
                {brands.map(([slug, name]) => (
                  <FilterChip key={slug} selected={brand === slug} onClick={() => { setBrand(slug); setCategory("All"); }}>{name}</FilterChip>
                ))}
              </div>
              <FacetRow chips={chips} value={category} onChange={setCategory} />
            </div>
          </div>
        }
      />
      <Container style={{ padding: "var(--sp-6) var(--gutter) var(--sp-9)" }}>
        <div className="d4p-feed-items">
          {filtered.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
        {filtered.length === 0 && <p role="status">선택한 조건에 맞는 아이템이 없습니다.</p>}
      </Container>
    </div>
  );
}
