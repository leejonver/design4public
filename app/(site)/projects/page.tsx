import type { Metadata } from "next";
import { fetchProjects, fetchCategories } from "@/lib/api";
import { createPageMetadata } from "@/lib/seo";
import { ProjectsView } from "./projects-view";

export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "프로젝트 · 공공조달 가구 납품사례",
  description: "공공기관·공공공간에 납품된 가구 프로젝트 사례를 브랜드·연도·카테고리별로 살펴봅니다.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const [projects, categories] = await Promise.all([
    fetchProjects(),
    fetchCategories("project"),
  ]);

  return (
    <ProjectsView
      projects={projects}
      categories={categories.map((c) => c.name)}
      count={projects.length}
    />
  );
}
