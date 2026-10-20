import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { SiteHeader } from "@/components/site/site-header";

vi.mock("next/navigation", () => ({ usePathname: () => "/items" }));
vi.mock("@/components/site/brand-search", () => ({ BrandSearch: () => null }));
vi.mock("@/components/site/contact-modal", () => ({ ContactButton: () => null }));

it("closes the mobile menu and restores scrolling when selecting the current page", () => {
  const media = vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  } as unknown as MediaQueryList);
  render(<SiteHeader />);
  fireEvent.click(screen.getByRole("button", { name: "메뉴" }));
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.click(screen.getByRole("link", { name: "Items" }));
  expect(screen.queryByRole("button", { name: "닫기" })).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
  media.mockRestore();
});
