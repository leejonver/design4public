"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { Container } from "@/components/site/primitives";
import { PageHero, FilterBar } from "@/components/site/page-chrome";
import { FacetRow } from "@/components/site/list-controls";
import { ProjectCard } from "@/components/site/cards";
import type { ProjectSummary } from "@/lib/types";

function ProjectsListView({
  projects,
  categories,
  count,
  query,
}: {
  projects: ProjectSummary[];
  categories: string[];
  count: number;
  query?: string;
}) {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("최신순");
  const [view, setView] = useState<"grid" | "list">("grid");

  const chips = ["All", ...categories];

  // Same substring predicate fetchProjects() used server-side, now applied client-side.
  const queried = useMemo(() => {
    if (!query) return projects;
    const k = query.toLowerCase();
    return projects.filter((p) =>
      [p.title, p.description, p.location, p.client, ...p.categories]
        .join(" ")
        .toLowerCase()
        .includes(k),
    );
  }, [projects, query]);

  const list = useMemo(() => {
    const filtered =
      category === "All"
        ? queried
        : queried.filter((p) => p.categories.includes(category));
    const sorted = [...filtered];
    if (sort === "최신순") {
      sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    } else if (sort === "이름순") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [queried, category, sort]);

  return (
    <div>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: "프로젝트" }]}
        title="PROJECTS"
        count={count}
        lead={
          query
            ? `‘${query}’ 검색 결과 ${queried.length}건`
            : "공공·업무 공간에 실제로 도입된 프로젝트를 둘러보세요."
        }
      />
      <FilterBar
        left={<FacetRow chips={chips} value={category} onChange={setCategory} />}
        right={
          <>
            <label className="d4p-sort">
              <span>정렬</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option>최신순</option>
                <option>이름순</option>
              </select>
            </label>
            <span className="d4p-viewtoggle">
              <button
                type="button"
                aria-label="그리드"
                aria-pressed={view === "grid"}
                data-active={view === "grid" ? "1" : undefined}
                onClick={() => setView("grid")}
              >
                <LayoutGrid size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="리스트"
                aria-pressed={view === "list"}
                data-active={view === "list" ? "1" : undefined}
                onClick={() => setView("list")}
              >
                <List size={18} strokeWidth={1.5} />
              </button>
            </span>
          </>
        }
      />
      <Container style={{ padding: "var(--sp-6) var(--gutter) var(--sp-9)" }}>
        <div className={view === "grid" ? "d4p-feed-projects" : "d4p-list"}>
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </Container>
    </div>
  );
}

function ProjectsViewInner(props: {
  projects: ProjectSummary[];
  categories: string[];
  count: number;
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() || undefined;
  return <ProjectsListView {...props} query={query} />;
}

export function ProjectsView(props: {
  projects: ProjectSummary[];
  categories: string[];
  count: number;
}) {
  return (
    <Suspense fallback={<ProjectsListView {...props} />}>
      <ProjectsViewInner {...props} />
    </Suspense>
  );
}
