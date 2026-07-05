import type { MetadataRoute } from "next";
import { fetchBrands, fetchItems, fetchPhotos, fetchProjects } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [projects, items, brands, photos] = await Promise.all([
    fetchProjects(),
    fetchItems(),
    fetchBrands(),
    fetchPhotos(),
  ]);

  const legalPaths = ["/privacy", "/terms"];
  const otherStaticPaths = ["/", "/projects", "/items", "/brands", "/photos"];
  const staticRoutes: MetadataRoute.Sitemap = [
    ...otherStaticPaths.map((path) => ({
      url: `${SITE_URL}${path === "/" ? "" : path}`,
      lastModified: now,
    })),
    ...legalPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date("2026-07-05"),
    })),
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_URL}/projects/${encodeURI(p.slug)}`,
    lastModified: new Date(p.updatedAt),
  }));
  const itemRoutes: MetadataRoute.Sitemap = items.map((i) => ({
    url: `${SITE_URL}/items/${encodeURI(i.slug)}`,
    lastModified: new Date(i.updatedAt),
  }));
  const brandRoutes: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${SITE_URL}/brands/${encodeURI(b.slug)}`,
    lastModified: new Date(b.updatedAt),
  }));
  const photoRoutes: MetadataRoute.Sitemap = photos.map((ph) => ({
    url: `${SITE_URL}/photos/${encodeURI(ph.id)}`,
    lastModified: new Date(ph.updatedAt),
  }));

  return [...staticRoutes, ...projectRoutes, ...itemRoutes, ...brandRoutes, ...photoRoutes];
}
