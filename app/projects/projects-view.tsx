"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/d4p/primitives";
import { PageHero, FilterBar } from "@/components/d4p/page-chrome";
import {
  FacetRow,
  FilterButton,
  Divider,
  SortMenu,
  ViewToggle,
} from "@/components/d4p/list-controls";
import { ProjectCard } from "@/components/d4p/cards";
import type { ProjectSummary } from "@/lib/types";

export function ProjectsView({
  projects,
  categories,
  count,
}: {
  projects: ProjectSummary[];
  categories: string[];
  count: number;
}) {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("최신순");
  const [view, setView] = useState<"grid" | "list">("grid");

  const chips = ["All", ...categories];

  const list = useMemo(() => {
    const filtered =
      category === "All"
        ? projects
        : projects.filter((p) => p.categories.includes(category));
    const sorted = [...filtered];
    if (sort === "최신순") {
      sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    } else if (sort === "이름순") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [projects, category, sort]);

  return (
    <div>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: "프로젝트" }]}
        title="PROJECTS"
        count={count}
        lead="공공·업무 공간에 실제로 도입된 프로젝트를 둘러보세요."
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
