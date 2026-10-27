import { expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  fetchProjects: async () => [{ slug: "회의실", updatedAt: "2026-10-01T00:00:00Z" }],
  fetchItems: async () => [],
  fetchBrands: async () => [],
  fetchAllPhotos: async () => [],
}));

import sitemap from "@/app/(site)/sitemap";

it("keeps actual content timestamps without inventing static-page modification dates", async () => {
  const entries = await sitemap();
  expect(entries.find((entry) => entry.url === "https://www.design4public.com")).not.toHaveProperty("lastModified");
  expect(entries.find((entry) => entry.url.includes("/projects/"))?.lastModified).toEqual(new Date("2026-10-01T00:00:00Z"));
  expect(entries.find((entry) => entry.url.endsWith("/privacy"))?.lastModified).toEqual(new Date("2026-07-05"));
});
