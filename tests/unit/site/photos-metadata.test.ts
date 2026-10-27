import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({ fetchPhotosPage: vi.fn() }));
vi.mock("@/components/site/photo-grid", () => ({ PhotosView: () => null }));

import { generateMetadata } from "@/app/(site)/photos/page";

describe("photo pagination metadata", () => {
  it.each([undefined, "1", "0", "-1", "invalid"])("uses the first page canonical for %s", async (page) => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ page }) });
    expect(metadata.alternates?.canonical).toBe("https://www.design4public.com/photos");
  });

  it.each(["2", "3", "21"])("keeps page %s independently discoverable", async (page) => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ page }) });
    const url = `https://www.design4public.com/photos?page=${page}`;
    expect(metadata.alternates?.canonical).toBe(url);
    expect(metadata.openGraph?.url).toBe(url);
    expect(metadata.title).toContain(`${page}페이지`);
  });
});
