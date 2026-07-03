import type { Metadata } from "next";
import { fetchProjects, fetchCategories } from "@/lib/api";
import { ProjectsView } from "./projects-view";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "PROJECTS",
};

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
