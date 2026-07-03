import type { Metadata } from "next";
import { fetchProjects, fetchCategories } from "@/lib/api";
import { ProjectsView } from "./projects-view";

// Reading searchParams opts this route into dynamic rendering; search-filtered
// listings should not be statically cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PROJECTS",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() || undefined;
  const [projects, categories] = await Promise.all([
    fetchProjects({ q }),
    fetchCategories("project"),
  ]);

  return (
    <ProjectsView
      projects={projects}
      categories={categories.map((c) => c.name)}
      count={projects.length}
      query={q}
    />
  );
}
