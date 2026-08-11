import Link from "next/link";
import type { CSSProperties } from "react";
import { fetchHomeData } from "@/lib/api";
import { Container, Overline } from "@/components/site/primitives";
import { FeaturedHero } from "@/components/site/featured-hero";
import { ProjectCard, ItemCard, BrandCard } from "@/components/site/cards";

export const revalidate = 3600;

const moreLink: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-sm)",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--ink-900)",
  flex: "none",
};

function SectionHead({
  overline,
  title,
  href,
  linkLabel = "전체보기 →",
}: {
  overline: string;
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 26,
        gap: 16,
      }}
    >
      <div>
        <Overline>{overline}</Overline>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "var(--fs-h3)",
            marginTop: 8,
            color: "var(--ink-900)",
          }}
        >
          {title}
        </h2>
      </div>
      <Link href={href} style={moreLink}>
        {linkLabel}
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const data = await fetchHomeData();
  const featured = data.featured;

  return (
    <div>
      {featured && (
        <Container style={{ padding: "var(--sp-6) var(--gutter) 0" }}>
          <FeaturedHero project={featured} />
        </Container>
      )}

      <Container style={{ padding: "var(--sp-7) var(--gutter)" }}>
        <SectionHead
          overline="Projects"
          title="주요 프로젝트"
          href="/projects"
          linkLabel="더보기 →"
        />
        <div className="d4p-grid-3">
          {data.projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </Container>

      <Container style={{ padding: "var(--sp-7) var(--gutter)" }}>
        <SectionHead overline="Items" title="주요 아이템" href="/items" />
        <div className="d4p-grid-4">
          {data.items.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
      </Container>

      <Container style={{ padding: "var(--sp-7) var(--gutter) var(--sp-8)" }}>
        <SectionHead overline="Brands" title="협력사" href="/brands" linkLabel="더 보기 →" />
        <div className="d4p-grid-4">
          {data.brands.map((b) => (
            <BrandCard key={b.id} brand={b} />
          ))}
        </div>
      </Container>
    </div>
  );
}
