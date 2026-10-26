import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ProjectMasthead } from "@/components/site/project-masthead";
import type { ProjectDetail } from "@/lib/types";

vi.mock("@/components/site/contact-modal", () => ({ ContactButton: () => null }));
const project: ProjectDetail = {
  id: "1", slug: "test", title: "Test", description: null, year: null,
  area: null, location: null, client: null, inquiryUrl: null, coverImage: null,
  categories: [], imageCount: 2, updatedAt: "", items: [],
  gallery: [
    { id: "a", url: "/a.jpg", alt: null, title: null },
    { id: "b", url: "/b.jpg", alt: null, title: null },
  ],
};

it("uses the active photo's natural ratio, including portrait photos and wraparound", async () => {
  const { container } = render(<ProjectMasthead project={project} />);
  const stage = container.querySelector('.d4p-pmast') as HTMLElement;
  const images = container.querySelectorAll('img');
  await act(async () => {
    [[1800, 1200], [900, 1600]].forEach(([width, height], index) => {
      Object.defineProperties(images[index], { naturalWidth: { value: width }, naturalHeight: { value: height } });
      fireEvent.load(images[index]);
    });
  });
  expect(stage.style.getPropertyValue('--pmast-ratio')).toBe('1.5');
  fireEvent.click(screen.getByRole('button', { name: '다음 사진' }));
  expect(stage.style.getPropertyValue('--pmast-ratio')).toBe('0.5625');
  fireEvent.click(screen.getByRole('button', { name: '다음 사진' }));
  expect(stage.style.getPropertyValue('--pmast-ratio')).toBe('1.5');
  fireEvent.click(screen.getByRole('button', { name: '이전 사진' }));
  expect(stage.style.getPropertyValue('--pmast-ratio')).toBe('0.5625');
});

it("keeps a usable placeholder when there are no photos", () => {
  render(<ProjectMasthead project={{ ...project, gallery: [] }} />);
  expect(screen.getByText('T')).toBeVisible();
  expect(screen.queryByRole('button', { name: '다음 사진' })).not.toBeInTheDocument();
});
