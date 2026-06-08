import type { MetadataRoute } from "next";
import { fetchBrands, fetchItems, fetchProjects } from "@/lib/api";
import type { BrandSummary, ItemSummary, ProjectSummary } from "@/lib/types";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [projects, items, brands] = await Promise.all([
    fetchProjects(),
    fetchItems(),
    fetchBrands(),
  ]);

  const staticPaths = ["/", "/projects", "/items", "/brands", "/photos", "/privacy", "/terms"];
  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project: ProjectSummary) => ({
    url: `${SITE_URL}/projects/${project.slug}`,
    lastModified: now,
  }));

  const itemRoutes: MetadataRoute.Sitemap = items.map((item: ItemSummary) => ({
    url: `${SITE_URL}/items/${item.slug}`,
    lastModified: now,
  }));

  const brandRoutes: MetadataRoute.Sitemap = brands.map((brand: BrandSummary) => ({
    url: `${SITE_URL}/brands/${brand.slug}`,
    lastModified: now,
  }));

  return [...staticRoutes, ...projectRoutes, ...itemRoutes, ...brandRoutes];
}
