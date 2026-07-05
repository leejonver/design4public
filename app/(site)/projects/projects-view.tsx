"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/site/primitives";
import { PageHero, FilterBar } from "@/components/site/page-chrome";
import {
  FacetRow,
  FilterButton,
  Divider,
  SortMenu,
  ViewToggle,
} from "@/components/site/list-controls";
import { ProjectCard } from "@/components/site/cards";
import type { ProjectSummary } from "@/lib/types";

function ProjectsViewInner({
  projects,
  categories,
  count,
}: {
  projects: ProjectSummary[];
  categories: string[];
  count: number;
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() || undefined;
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
            <FilterButton />
            <Divider />
            <SortMenu value={sort} onChange={setSort} options={["최신순", "인기순", "이름순"]} />
            <ViewToggle view={view} onView={setView} />
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

export function ProjectsView(props: {
  projects: ProjectSummary[];
  categories: string[];
  count: number;
}) {
  return (
    <Suspense fallback={null}>
      <ProjectsViewInner {...props} />
    </Suspense>
  );
}
