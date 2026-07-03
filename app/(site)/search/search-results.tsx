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
          <p style={{ color: "var(--ink-400)", fontSize: 15 }}>검색 결과가 없습니다.</p>
        )}
        {SECTION_ORDER.map((sec) =>
          groups[sec].length > 0 ? (
            <section key={sec} style={{ marginBottom: "var(--sp-8)" }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-500)", marginBottom: "var(--sp-3)" }}>
                {SECTION_LABEL[sec]} ({groups[sec].length})
              </h2>
              <ul style={{ display: "grid", gap: "var(--sp-2)", listStyle: "none", padding: 0, margin: 0 }}>
                {groups[sec].map((hit) => (
                  <li key={`${hit.entityType}-${hit.entityId}`}>
                    <Link
                      href={hit.href}
                      className="d4p-srch-row"
                      style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}
                    >
                      <span
                        className="d4p-srch-thumb"
                        style={{ borderRadius: hit.entityType === "brand" ? "var(--radius-pill)" : "var(--radius-sm)" }}
                      >
                        {hit.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element -- remote, dynamic-aspect Supabase storage image rendered CSS-fill; next/image (fill) would change the tuned layout. */
                          <img src={hit.imageUrl} alt="" loading="lazy" />
                        ) : (
                          <span
                            style={{
                              display: "flex",
                              width: "100%",
                              height: "100%",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              color: "var(--ink-400)",
                            }}
                          >
                            {hit.title.charAt(0) || "D"}
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink-900)" }}>{hit.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </Container>
    </div>
  );
}
