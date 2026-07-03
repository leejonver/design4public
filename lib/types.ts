/* DESIGN4PUBLIC — normalized view models consumed by UI components.
   The raw DB schema (photos / project_photos / photo_items / categories joins)
   is flattened here into image-led shapes the design expects. */

export type PhotoLite = {
  id: string;
  url: string;
  alt: string | null;
  title: string | null;
};

export type Category = {
  id: string;
  name: string;
};

export type ProjectSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  year: number | null;
  area: number | null;
  location: string | null;
  client: string | null;
  inquiryUrl: string | null;
  coverImage: string | null;
  categories: string[];
  imageCount: number;
  updatedAt: string;
};

export type BrandSummary = {
  id: string;
  slug: string;
  nameKo: string;
  nameEn: string | null;
  description: string | null;
  logo: string | null;
  cover: string | null;
  website: string | null;
  itemCount: number;
  projectCount: number;
  updatedAt: string;
};

export type ItemSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  naraUrl: string | null;
  image: string | null;
  brandName: string | null;
  brandNameEn: string | null;
  brandSlug: string | null;
  categories: string[];
  updatedAt: string;
};

export type ProjectDetail = ProjectSummary & {
  gallery: PhotoLite[];
  items: ItemSummary[];
};

export type ItemDetail = ItemSummary & {
  gallery: PhotoLite[];
  brand: BrandSummary | null;
  projects: ProjectSummary[];
};

export type BrandDetail = BrandSummary & {
  items: ItemSummary[];
  projects: ProjectSummary[];
};

export type PhotoFeedItem = {
  id: string;
  url: string;
  alt: string | null;
  title: string | null;
  description: string | null;
  projectId: string | null;
  projectSlug: string | null;
  projectTitle: string | null;
  projectCategories: string[];
  year: number | null;
  location: string | null;
  updatedAt: string;
};

export type PhotoDetail = PhotoFeedItem & {
  items: ItemSummary[];
};

export type Counts = {
  projects: number;
  items: number;
  brands: number;
  photos: number;
};

export type HomeData = {
  featured: ProjectDetail | null;
  projects: ProjectSummary[];
  items: ItemSummary[];
  brands: BrandSummary[];
  photos: PhotoFeedItem[];
  counts: Counts;
};

/* Lightweight index used by the header BrandSearch autocomplete. */
export type SearchIndex = {
  projects: { slug: string; title: string; year: number | null; location: string | null; categories: string[]; image: string | null }[];
  items: { slug: string; name: string; brandName: string | null; categories: string[]; image: string | null }[];
  brands: { slug: string; nameKo: string; nameEn: string | null; image: string | null }[];
};
