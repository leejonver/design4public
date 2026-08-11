import { Container } from "@/components/site/primitives";
import { PageHero } from "@/components/site/page-chrome";
import { BrandCard } from "@/components/site/cards";
import type { BrandSummary } from "@/lib/types";

export function BrandsView({ brands, count }: { brands: BrandSummary[]; count: number }) {
  return (
    <div>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: "브랜드" }]}
        title="BRANDS"
        count={count}
        lead="국내외 오피스 가구 브랜드를 한곳에서."
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
