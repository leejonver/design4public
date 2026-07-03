import { supabase } from "./supabase/public";
import { unionById } from "./relations";
import type {
  BrandDetail,
  BrandSummary,
  Category,
  Counts,
  HomeData,
  ItemDetail,
  ItemSummary,
  PhotoDetail,
  PhotoFeedItem,
  PhotoLite,
  ProjectDetail,
  ProjectSummary,
  SearchIndex,
} from "./types";

/* ============================================================
   Raw row helpers (the embedded shapes PostgREST returns)
   ============================================================ */
type RawPhoto = { id: string; image_url: string; alt_text: string | null; title: string | null };
type RawProjectPhoto = { is_main: boolean | null; order: number | null; photos: RawPhoto | null };
type RawPhotoItem = { is_main: boolean | null; order: number | null; photos: { image_url: string } | null };
type RawCategoryJoin = { categories: { id?: string; name: string } | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic PostgREST join shapes (see lib/dto.ts Row)
type Raw = Record<string, any>;

/* Next can hand a route param through still percent-encoded (non-ASCII slugs).
   Decode defensively so the DB lookup matches the stored slug. */
function safeDecodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

const ord = (n: number | null | undefined) => (n == null ? Number.MAX_SAFE_INTEGER : n);
const byOrder = <T extends { order: number | null }>(a: T, b: T) => ord(a.order) - ord(b.order);

function coverFrom(rows: RawProjectPhoto[] | null | undefined): string | null {
  if (!rows?.length) return null;
  const sorted = [...rows].sort(byOrder);
  const main = sorted.find((r) => r.is_main && r.photos?.image_url);
  return (main ?? sorted.find((r) => r.photos?.image_url))?.photos?.image_url ?? null;
}

function galleryFrom(rows: RawProjectPhoto[] | null | undefined): PhotoLite[] {
  if (!rows?.length) return [];
  return [...rows]
    .sort((a, b) => Number(!!b.is_main) - Number(!!a.is_main) || byOrder(a, b))
    .filter((r) => r.photos?.image_url)
    .map((r) => ({
      id: r.photos!.id,
      url: r.photos!.image_url,
      alt: r.photos!.alt_text,
      title: r.photos!.title,
    }));
}

function itemImageFrom(rows: RawPhotoItem[] | null | undefined): string | null {
  if (!rows?.length) return null;
  const sorted = [...rows].sort(byOrder);
  const main = sorted.find((r) => r.is_main && r.photos?.image_url);
  return (main ?? sorted.find((r) => r.photos?.image_url))?.photos?.image_url ?? null;
}

function categoryNames(rows: RawCategoryJoin[] | null | undefined): string[] {
  return (rows ?? []).map((r) => r.categories?.name).filter((n): n is string => Boolean(n));
}

function normalizeProjectSummary(p: Raw): ProjectSummary {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? null,
    year: p.year ?? null,
    area: p.area ?? null,
    location: p.location ?? null,
    client: p.client ?? null,
    inquiryUrl: p.inquiry_url ?? null,
    coverImage: coverFrom(p.project_photos),
    categories: categoryNames(p.project_categories),
    imageCount: (p.project_photos ?? []).length,
    updatedAt: p.updated_at,
  };
}

function normalizeItemSummary(it: Raw): ItemSummary {
  return {
    id: it.id,
    slug: it.slug,
    name: it.name,
    description: it.description ?? null,
    naraUrl: it.nara_url ?? null,
    image: itemImageFrom(it.photo_items),
    brandName: it.brands?.name_ko ?? null,
    brandNameEn: it.brands?.name_en ?? null,
    brandSlug: it.brands?.slug ?? null,
    categories: categoryNames(it.item_categories),
    updatedAt: it.updated_at,
  };
}

function normalizeBrandSummary(b: Raw): BrandSummary {
  return {
    id: b.id,
    slug: b.slug,
    nameKo: b.name_ko,
    nameEn: b.name_en ?? null,
    description: b.description ?? null,
    logo: b.logo_image_url ?? null,
    cover: b.cover_image_url ?? null,
    website: b.website_url ?? null,
    itemCount: (b.items ?? []).length,
    projectCount: 0,
    updatedAt: b.updated_at,
  };
}

/* ============================================================
   Select fragments
   ============================================================ */
const PROJECT_SUMMARY_SELECT = `
  id,slug,title,description,year,area,location,client,inquiry_url,status,updated_at,
  project_photos(is_main,order,photos(id,image_url,alt_text,title)),
  project_categories(categories(id,name))
`;

const ITEM_SUMMARY_SELECT = `
  id,slug,name,description,nara_url,status,brand_id,updated_at,
  brands(name_ko,name_en,slug),
  photo_items(is_main,order,photos(id,image_url,alt_text,title)),
  item_categories(categories(id,name))
`;

/* Project detail select: like the summary, but project photos also carry the
   items tagged on them (derived project→photo→item model). galleryFrom/coverFrom
   ignore the extra nested photo_items. */
const PROJECT_DETAIL_SELECT = `
  id,slug,title,description,year,area,location,client,inquiry_url,status,updated_at,
  project_photos(is_main,order,photos(id,image_url,alt_text,title,photo_items(items(${ITEM_SUMMARY_SELECT})))),
  project_categories(categories(id,name))
`;

/* ============================================================
   Projects
   ============================================================ */
export type ProjectFilters = { q?: string; category?: string; year?: string };

export async function fetchProjects(filters: ProjectFilters = {}): Promise<ProjectSummary[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SUMMARY_SELECT)
    .eq("status", "published")
    .order("year", { ascending: false, nullsFirst: false })
    .order("title", { ascending: true });
  if (error) throw error;

  let projects = (data ?? []).map(normalizeProjectSummary);

  if (filters.q) {
    const k = filters.q.toLowerCase();
    projects = projects.filter((p) =>
      [p.title, p.description, p.location, p.client, ...p.categories].join(" ").toLowerCase().includes(k)
    );
  }
  if (filters.category && filters.category !== "All") {
    projects = projects.filter((p) => p.categories.includes(filters.category!));
  }
  if (filters.year) {
    projects = projects.filter((p) => String(p.year) === filters.year);
  }
  return projects;
}

export async function fetchProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  slug = safeDecodeSlug(slug);
  const { data, error } = await supabase
    .from("projects")
    .select(
      `${PROJECT_DETAIL_SELECT},
       project_items(items(${ITEM_SUMMARY_SELECT}))`
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const summary = normalizeProjectSummary(data);

  // Direct links (legacy project_items) ∪ derived links (this project's photos'
  // tagged items). Union keeps direct first, dedupes by id — no regression while
  // content is being retagged (spec §7-1 stage 2).
  const direct: ItemSummary[] = ((data as Raw).project_items ?? [])
    .map((pi: Raw) => pi.items)
    .filter(Boolean)
    .map(normalizeItemSummary);
  const derived: ItemSummary[] = ((data as Raw).project_photos ?? [])
    .flatMap((pp: Raw) => pp.photos?.photo_items ?? [])
    .map((pi: Raw) => pi.items)
    .filter(Boolean)
    .map(normalizeItemSummary);
  const items = unionById(direct, derived);

  return { ...summary, gallery: galleryFrom((data as Raw).project_photos), items };
}

/* ============================================================
   Items
   ============================================================ */
export type ItemFilters = { q?: string; category?: string; brand?: string };

export async function fetchItems(filters: ItemFilters = {}): Promise<ItemSummary[]> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SUMMARY_SELECT)
    .neq("status", "hidden")
    .order("name", { ascending: true });
  if (error) throw error;

  let items = (data ?? []).map(normalizeItemSummary);

  if (filters.q) {
    const k = filters.q.toLowerCase();
    items = items.filter((i) =>
      [i.name, i.description, i.brandName, i.brandNameEn, ...i.categories].join(" ").toLowerCase().includes(k)
    );
  }
  if (filters.category && filters.category !== "All") {
    items = items.filter((i) => i.categories.includes(filters.category!));
  }
  if (filters.brand) {
    items = items.filter((i) => i.brandSlug === filters.brand);
  }
  return items;
}

export async function fetchItemBySlug(slug: string): Promise<ItemDetail | null> {
  slug = safeDecodeSlug(slug);
  const { data, error } = await supabase
    .from("items")
    .select(
      `id,slug,name,description,nara_url,status,brand_id,
       brands(id,slug,name_ko,name_en,description,logo_image_url,cover_image_url,website_url),
       photo_items(is_main,order,photos(id,image_url,alt_text,title,project_photos(projects(${PROJECT_SUMMARY_SELECT})))),
       item_categories(categories(id,name)),
       project_items(projects(${PROJECT_SUMMARY_SELECT}))`
    )
    .eq("slug", slug)
    .neq("status", "hidden")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const summary = normalizeItemSummary(data);
  const gallery: PhotoLite[] = [...((data as Raw).photo_items ?? [])]
    .sort((a: Raw, b: Raw) => Number(!!b.is_main) - Number(!!a.is_main) || ord(a.order) - ord(b.order))
    .filter((r: Raw) => r.photos?.image_url)
    .map((r: Raw) => ({ id: r.photos.id, url: r.photos.image_url, alt: r.photos.alt_text, title: r.photos.title }));

  const brandRaw = (data as Raw).brands;
  const brand: BrandSummary | null = brandRaw ? { ...normalizeBrandSummary({ ...brandRaw, items: [] }) } : null;

  const directProjects: ProjectSummary[] = ((data as Raw).project_items ?? [])
    .map((pi: Raw) => pi.projects)
    .filter((p: Raw) => p && p.status === "published")
    .map(normalizeProjectSummary);
  const derivedProjects: ProjectSummary[] = ((data as Raw).photo_items ?? [])
    .flatMap((pi: Raw) => pi.photos?.project_photos ?? [])
    .map((pp: Raw) => pp.projects)
    .filter((p: Raw) => p && p.status === "published")
    .map(normalizeProjectSummary);
  const projects = unionById(directProjects, derivedProjects);

  return { ...summary, gallery, brand, projects };
}

/* ============================================================
   Brands
   ============================================================ */
export async function fetchBrands(): Promise<BrandSummary[]> {
  const { data, error } = await supabase
    .from("brands")
    .select(
      `id,slug,name_ko,name_en,description,logo_image_url,cover_image_url,website_url,status,updated_at,items(id)`
    )
    .order("name_ko", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeBrandSummary);
}

export async function fetchBrandBySlug(slug: string): Promise<BrandDetail | null> {
  slug = safeDecodeSlug(slug);
  const { data, error } = await supabase
    .from("brands")
    .select(
      `id,slug,name_ko,name_en,description,logo_image_url,cover_image_url,website_url,updated_at,
       items(${ITEM_SUMMARY_SELECT},
         derived_pi:photo_items(photos(project_photos(projects(${PROJECT_SUMMARY_SELECT})))),
         project_items(projects(${PROJECT_SUMMARY_SELECT})))`
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const rawItems = (data as Raw).items ?? [];
  const items = rawItems.map(normalizeItemSummary);

  // Direct links (legacy project_items) ∪ derived links (each item's photos'
  // tagged projects) across this brand's items, published-only, deduped by id.
  const directProjects: ProjectSummary[] = rawItems
    .flatMap((it: Raw) => it.project_items ?? [])
    .map((pi: Raw) => pi.projects)
    .filter((p: Raw) => p && p.status === "published")
    .map(normalizeProjectSummary);
  const derivedProjects: ProjectSummary[] = rawItems
    .flatMap((it: Raw) => it.derived_pi ?? [])
    .flatMap((pi: Raw) => pi.photos?.project_photos ?? [])
    .map((pp: Raw) => pp.projects)
    .filter((p: Raw) => p && p.status === "published")
    .map(normalizeProjectSummary);
  const projects = unionById(directProjects, derivedProjects).sort((a, b) => ord(b.year) - ord(a.year));

  const summary = normalizeBrandSummary({ ...data, items: rawItems });
  return { ...summary, itemCount: items.length, projectCount: projects.length, items, projects };
}

/* ============================================================
   Photos
   ============================================================ */
function normalizePhotoFeed(row: Raw): PhotoFeedItem {
  const proj = row.project_photos?.[0]?.projects ?? null;
  return {
    id: row.id,
    url: row.image_url,
    alt: row.alt_text ?? null,
    title: row.title ?? null,
    description: row.description ?? null,
    projectId: proj?.id ?? null,
    projectSlug: proj?.slug ?? null,
    projectTitle: proj?.title ?? null,
    projectCategories: categoryNames(proj?.project_categories),
    year: proj?.year ?? null,
    location: proj?.location ?? null,
    updatedAt: row.updated_at,
  };
}

export async function fetchPhotos(limit = 120): Promise<PhotoFeedItem[]> {
  const { data, error } = await supabase
    .from("photos")
    .select(
      `id,image_url,alt_text,title,description,created_at,updated_at,
       project_photos(order,projects(id,slug,title,year,location,status,project_categories(categories(name))))`
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? [])
    .map(normalizePhotoFeed)
    // only show photos that belong to a published project
    .filter((p) => p.projectSlug != null);
}

export async function fetchPhotoById(id: string): Promise<PhotoDetail | null> {
  const { data, error } = await supabase
    .from("photos")
    .select(
      `id,image_url,alt_text,title,description,created_at,updated_at,
       project_photos(order,projects(id,slug,title,year,location,status,project_categories(categories(name)))),
       tagged:photo_items(is_main,order,items(${ITEM_SUMMARY_SELECT}))`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Public iff the photo belongs to a PUBLISHED project (mirrors fetchPhotos).
  // Item-gallery-only photos get no indexable detail page.
  const publishedLink = ((data as Raw).project_photos ?? []).find(
    (pp: Raw) => pp.projects?.status === "published"
  );
  if (!publishedLink) return null;

  const feed = normalizePhotoFeed({ ...data, project_photos: [publishedLink] });
  const items: ItemSummary[] = [...((data as Raw).tagged ?? [])]
    .sort((a: Raw, b: Raw) => Number(!!b.is_main) - Number(!!a.is_main) || ord(a.order) - ord(b.order))
    .map((r: Raw) => r.items)
    .filter(Boolean)
    .map(normalizeItemSummary);

  return { ...feed, items };
}

/* ============================================================
   Categories / counts / search index / home
   ============================================================ */
export async function fetchCategories(type: "project" | "item"): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,type")
    .eq("type", type)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({ id: c.id, name: c.name }));
}

async function count(table: "projects" | "items" | "brands" | "photos"): Promise<number> {
  const q = supabase.from(table).select("id", { count: "exact", head: true });
  const { count: c, error } = table === "projects" ? await q.eq("status", "published") : await q;
  if (error) return 0;
  return c ?? 0;
}

export async function fetchCounts(): Promise<Counts> {
  const [projects, items, brands, photos] = await Promise.all([
    count("projects"),
    count("items"),
    count("brands"),
    count("photos"),
  ]);
  return { projects, items, brands, photos };
}

export async function fetchSearchIndex(): Promise<SearchIndex> {
  const [projects, items, brands] = await Promise.all([fetchProjects(), fetchItems(), fetchBrands()]);
  return {
    projects: projects.slice(0, 200).map((p) => ({
      slug: p.slug,
      title: p.title,
      year: p.year,
      location: p.location,
      categories: p.categories,
      image: p.coverImage,
    })),
    items: items.slice(0, 300).map((i) => ({
      slug: i.slug,
      name: i.name,
      brandName: i.brandName,
      categories: i.categories,
      image: i.image,
    })),
    brands: brands.map((b) => ({ slug: b.slug, nameKo: b.nameKo, nameEn: b.nameEn, image: b.cover ?? b.logo })),
  };
}

/* Home is curated from the admin config tables:
   - site_settings.featured_project_id → the hero project
   - home_featured(entity_type, entity_id, order) → the project/item showcase rows */
async function fetchSiteSettings(): Promise<{ featured_project_id: string | null } | null> {
  const { data } = await supabase
    .from("site_settings")
    .select("featured_project_id")
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function fetchHomeFeatured(): Promise<{ projectIds: string[]; itemIds: string[] }> {
  const { data } = await supabase
    .from("home_featured")
    .select("entity_type,entity_id,order")
    .order("order", { ascending: true });
  const rows = data ?? [];
  return {
    projectIds: rows.filter((r) => r.entity_type === "project").map((r) => r.entity_id),
    itemIds: rows.filter((r) => r.entity_type === "item").map((r) => r.entity_id),
  };
}

export async function fetchHomeData(): Promise<HomeData> {
  const [projects, items, brands, photos, counts, settings, featuredList] = await Promise.all([
    fetchProjects(),
    fetchItems(),
    fetchBrands(),
    fetchPhotos(12),
    fetchCounts(),
    fetchSiteSettings(),
    fetchHomeFeatured(),
  ]);

  // Featured hero: configured project if set, else the richest gallery as a fallback.
  const featuredId = settings?.featured_project_id ?? null;
  let featuredSlug = featuredId ? projects.find((p) => p.id === featuredId)?.slug : undefined;
  if (!featuredSlug) {
    featuredSlug = [...projects].sort((a, b) => b.imageCount - a.imageCount)[0]?.slug;
  }
  const featured = featuredSlug ? await fetchProjectBySlug(featuredSlug) : null;

  const pick = <T extends { id: string }>(arr: T[], ids: string[]): T[] =>
    ids.map((id) => arr.find((x) => x.id === id)).filter((x): x is T => Boolean(x));

  // Curated projects (ordered) → fall back to recent published; never duplicate the hero.
  const curatedProjects = pick(projects, featuredList.projectIds).filter((p) => p.id !== featured?.id);
  const homeProjects = (
    curatedProjects.length ? curatedProjects : projects.filter((p) => p.id !== featured?.id)
  ).slice(0, 6);

  // Curated items (ordered) → fall back to items that have a photo first.
  const curatedItems = pick(items, featuredList.itemIds);
  const homeItems = (
    curatedItems.length ? curatedItems : [...items].sort((a, b) => Number(!!b.image) - Number(!!a.image))
  ).slice(0, 8);

  return { featured, projects: homeProjects, items: homeItems, brands, photos, counts };
}

/* Inquiry form payload (consumed by the contact modal + /api/inquiry) */
export type InquiryFormData = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  project_slug?: string;
  message: string;
};
