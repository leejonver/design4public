import Link from "next/link";
import type { CSSProperties } from "react";
import { fetchHomeData } from "@/lib/api";
import { Container, Overline } from "@/components/d4p/primitives";
import { FeaturedHero } from "@/components/d4p/featured-hero";
import { ProjectCard, ItemCard, BrandCard } from "@/components/d4p/cards";

export const revalidate = 3600;

const moreLink: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--ink-900)",
  flex: "none",
};

function SectionHead({ overline, title, href }: { overline: string; title: string; href: string }) {
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
            fontSize: "clamp(1.4rem,2.2vw,1.7rem)",
            marginTop: 8,
            color: "var(--ink-900)",
          }}
        >
          {title}
        </h2>
      </div>
      <Link href={href} style={moreLink}>
        전체보기 →
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
        <SectionHead overline="Projects" title="주목할 만한 프로젝트" href="/projects" />
        <div className="d4p-grid-3">
          {data.projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </Container>

      <Container style={{ padding: "var(--sp-7) var(--gutter)" }}>
        <SectionHead overline="Latest Photos" title="최근 등록된 포토" href="/photos" />
        <div className="d4p-grid-4">
          {data.photos.slice(0, 8).map((ph) => (
            <Link
              key={ph.id}
              href="/photos"
              className="d4p-photo-tile"
              style={{ aspectRatio: "1 / 1" }}
            >
              <img src={ph.url} alt={ph.alt ?? ph.title ?? ""} loading="lazy" />
            </Link>
          ))}
        </div>
      </Container>

      <Container style={{ padding: "var(--sp-7) var(--gutter)" }}>
        <SectionHead overline="Items" title="인기 아이템" href="/items" />
        <div className="d4p-grid-4">
          {data.items.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
      </Container>

      <Container style={{ padding: "var(--sp-7) var(--gutter) var(--sp-8)" }}>
        <SectionHead overline="Brands" title="등록된 브랜드" href="/brands" />
        <div className="d4p-grid-4">
          {data.brands.map((b) => (
            <BrandCard key={b.id} brand={b} />
          ))}
        </div>
      </Container>
    </div>
  );
}
