import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "../utils/test-utils";
import * as api from "../../lib/api";

const mockBrand = {
  id: "brand-1",
  slug: "brand-1",
  name_ko: "브랜드 1",
  name_en: null,
  description: "설명",
  logo_image_url: null,
  cover_image_url: null,
  website_url: null,
  items: [],
  projects: [
    {
      project_id: "project-1",
      projects: {
        id: "project-1",
        slug: "project-1",
        title: "프로젝트 1",
        cover_image_url: null,
        year: 2024,
        status: "published",
      },
    },
  ],
};

vi.mock("../../lib/api");

const loadPage = () => import("../../app/brands/[slug]/page");

describe("Brand detail page", () => {
  beforeEach(() => {
    (api.fetchBrandBySlug as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockBrand);
  });

  it("renders brand and associated projects", async () => {
    const { default: BrandDetailPage } = await loadPage();
    const element = await BrandDetailPage({ params: { slug: "brand-1" } } as any);
    render(element);

    expect(screen.getByText("브랜드 1")).toBeInTheDocument();
    expect(screen.getByText("프로젝트 1")).toBeInTheDocument();
  });
});
