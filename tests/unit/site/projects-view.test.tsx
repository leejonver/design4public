import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectsView } from "@/app/(site)/projects/projects-view";
import type { ProjectSummary } from "@/lib/types";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

const projects: ProjectSummary[] = [
  { id: "1", slug: "older-office", title: "Older office", description: null, year: 2022, area: null, location: null, client: null, inquiryUrl: null, coverImage: null, categories: ["오피스"], imageCount: 0, updatedAt: "" },
  { id: "2", slug: "newer-public", title: "Newer public", description: null, year: 2024, area: null, location: null, client: null, inquiryUrl: null, coverImage: null, categories: ["공공"], imageCount: 0, updatedAt: "" },
];

describe("ProjectsView", () => {
  it("filters, sorts, and exposes the selected view toggle", () => {
    const { container } = render(<ProjectsView projects={projects} categories={["오피스", "공공"]} count={2} />);

    fireEvent.click(screen.getByRole("button", { name: "오피스" }));
    expect(screen.getByRole("link", { name: /Older office/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Newer public/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "이름순" } });
    expect(Array.from(container.querySelectorAll("a.d4p-card")).map((card) => card.getAttribute("href"))).toEqual([
      "/projects/newer-public",
      "/projects/older-office",
    ]);

    const list = screen.getByRole("button", { name: "리스트" });
    expect(screen.getByRole("button", { name: "그리드" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(list);
    expect(list).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".d4p-list")).toBeInTheDocument();
  });
});
