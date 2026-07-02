"use client";

import { useState } from "react";
import { Container } from "@/components/d4p/primitives";
import { PageHero, FilterBar } from "@/components/d4p/page-chrome";
import { FacetRow, FilterButton, Divider, SortMenu, ViewToggle } from "@/components/d4p/list-controls";
import { ItemCard } from "@/components/d4p/cards";
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
  const [sort, setSort] = useState("최신순");
  const [view, setView] = useState<"grid" | "list">("grid");

  const chips = ["All", ...categories];
  const filtered =
    category === "All" ? items : items.filter((it) => it.categories.includes(category));

  return (
    <div>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: "아이템" }]}
        title="ITEMS"
        count={count}
        lead="브랜드별 오피스 가구 아이템을 사양과 함께 살펴보세요."
      />
      <FilterBar
        left={<FacetRow chips={chips} value={category} onChange={setCategory} />}
        right={
          <>
            <FilterButton />
            <Divider />
            <SortMenu value={sort} onChange={setSort} options={["최신순", "인기순", "이름순"]} />
            <ViewToggle view={view} onView={setView} />
          </>
        }
      />
      <Container style={{ padding: "var(--sp-6) var(--gutter) var(--sp-9)" }}>
        <div className="d4p-feed-items">
          {filtered.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
      </Container>
    </div>
  );
}
