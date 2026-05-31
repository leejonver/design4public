import type { MetadataRoute } from "next";
import { fetchBrands, fetchItems, fetchProjects } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";

type ProjectEntry = Awaited<ReturnType<typeof fetchProjects>>[number];
type ItemEntry = Awaited<ReturnType<typeof fetchItems>>[number];
type BrandEntry = Awaited<ReturnType<typeof fetchBrands>>[number];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, items, brands] = await Promise.all([
    fetchProjects(),
    fetchItems(),
    fetchBrands(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/items`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/brands`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project: ProjectEntry) => ({
    url: `${SITE_URL}/projects/${project.slug}`,
    lastModified: project.updated_at ? new Date(project.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const itemRoutes: MetadataRoute.Sitemap = items
    .filter((item: ItemEntry) => item.status !== "hidden")
    .map((item: ItemEntry) => ({
      url: `${SITE_URL}/items/${item.slug}`,
      lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  const brandRoutes: MetadataRoute.Sitemap = brands.map((brand: BrandEntry) => ({
    url: `${SITE_URL}/brands/${brand.slug}`,
    lastModified: brand.updated_at ? new Date(brand.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes, ...itemRoutes, ...brandRoutes];
}
