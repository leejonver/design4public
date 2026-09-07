import Image from "next/image";
import Link from "next/link";
import type { EntityType, SearchGroups } from "@/lib/search/query";
import { Container } from "@/components/site/primitives";
import { PageHero } from "@/components/site/page-chrome";

const SECTION_LABEL: Record<EntityType, string> = {
  project: "프로젝트",
  item: "아이템",
  brand: "브랜드",
  photo: "포토",
};
const SECTION_ORDER: EntityType[] = ["project", "item", "brand", "photo"];

const TILE_SIZES = "(max-width:460px) 50vw, (max-width:900px) 33vw, (max-width:1400px) 20vw, 16vw";

export function SearchResults({ query, groups }: { query: string; groups: SearchGroups }) {
  const total = SECTION_ORDER.reduce((n, k) => n + groups[k].length, 0);

  return (
    <div>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: "검색" }]}
        title="SEARCH"
        count={total}
        lead={query ? `‘${query}’ 검색 결과 ${total}건` : "검색어를 입력해 주세요."}
      />
      <Container style={{ padding: "var(--sp-6) var(--gutter) var(--sp-9)" }}>
        {query && total === 0 && (
          <p style={{ color: "var(--ink-400)", fontSize: "var(--fs-body)" }}>검색 결과가 없습니다.</p>
        )}
        {SECTION_ORDER.map((sec) =>
          groups[sec].length > 0 ? (
            <section key={sec} style={{ marginBottom: "var(--sp-8)" }}>
              <h2 style={{ fontSize: "var(--fs-sm)", fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-500)", marginBottom: "var(--sp-3)" }}>
                {SECTION_LABEL[sec]} ({groups[sec].length})
              </h2>
              {/* Image-led tile grid (same tile as the photo feed); the title is the
                  hover caption + accessible name, so image-only rows stay scannable. */}
              <div className="d4p-srch-grid" data-kind={sec}>
                {groups[sec].map((hit) => (
                  <Link
                    key={`${hit.entityType}-${hit.entityId}`}
                    href={hit.href}
                    className="d4p-photo-tile"
                    aria-label={hit.title}
                    title={hit.title}
                  >
                    {hit.imageUrl ? (
                      <Image src={hit.imageUrl} alt="" fill sizes={TILE_SIZES} />
                    ) : (
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 12px",
                          textAlign: "center",
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: "var(--fs-body)",
                          color: "var(--ink-500)",
                          wordBreak: "keep-all",
                        }}
                      >
                        {hit.title}
                      </span>
                    )}
                    <span className="d4p-photo-cap">{hit.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null,
        )}
      </Container>
    </div>
  );
}
