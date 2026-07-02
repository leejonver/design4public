"use client";

import { useState } from "react";
import { Container } from "@/components/site/primitives";
import { PageHero, FilterBar } from "@/components/site/page-chrome";
import { FilterButton, Divider, SortMenu } from "@/components/site/list-controls";
import { BrandCard } from "@/components/site/cards";
import type { BrandSummary } from "@/lib/types";

export function BrandsView({ brands, count }: { brands: BrandSummary[]; count: number }) {
  const [sort, setSort] = useState("이름순");

  return (
    <div>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: "브랜드" }]}
        title="BRANDS"
        count={count}
        lead="국내외 오피스 가구 브랜드를 한곳에서."
      />
      <FilterBar
        right={
          <>
            <FilterButton />
            <Divider />
            <SortMenu value={sort} onChange={setSort} options={["이름순", "아이템순", "프로젝트순"]} />
          </>
        }
      />
      <Container style={{ padding: "var(--sp-6) var(--gutter) var(--sp-9)" }}>
        <div className="d4p-feed-brands">
          {brands.map((b) => (
            <BrandCard key={b.id} brand={b} />
          ))}
        </div>
      </Container>
    </div>
  );
}
