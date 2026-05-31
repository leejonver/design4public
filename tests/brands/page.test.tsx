import { describe, it, expect } from "vitest";
import { render, screen } from "../utils/test-utils";

vi.mock("../../lib/api", () => ({
  fetchBrands: async () => [
    {
      id: "brand-1",
      slug: "brand-1",
      name_ko: "브랜드 1",
      name_en: null,
      description: "설명",
      logo_image_url: null,
      cover_image_url: null,
      website_url: null,
    },
  ],
  fetchProjects: async () => [],
}));

const loadPage = () => import("../../app/brands/page").then((mod) => mod.default);

describe("Brands page", () => {
  it("renders brand cards", async () => {
    const BrandsPage = await loadPage();
    const element = await BrandsPage();
    render(element);
    expect(screen.getByText("브랜드 1")).toBeInTheDocument();
  });
});
