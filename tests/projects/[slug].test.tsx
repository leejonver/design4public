import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "../utils/test-utils";
import * as api from "../../lib/api";

const mockProject = {
  id: "project-1",
  slug: "project-1",
  title: "프로젝트 1",
  description: "설명",
  cover_image_url: "https://example.com/cover.jpg",
  year: 2024,
  area: 100,
  status: "published",
  project_images: [],
  project_tags: [],
  project_items: [],
};

vi.mock("../../lib/api");

const loadPage = () => import("../../app/projects/[slug]/page");

describe("Project detail page", () => {
  beforeEach(() => {
    (api.fetchProjectBySlug as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject);
    (api.fetchProjectPhotosWithItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("renders project information", async () => {
    const { default: ProjectDetailPage } = await loadPage();
    const element = await ProjectDetailPage({ params: { slug: "project-1" } } as any);
    render(element);

    expect(screen.getByText("프로젝트 1")).toBeInTheDocument();
  });

  it("sets metadata based on project", async () => {
    const { generateMetadata } = await loadPage();
    const metadata = await generateMetadata({ params: { slug: "project-1" } } as any);
    expect(metadata.title).toBe("프로젝트 1");
  });
});
