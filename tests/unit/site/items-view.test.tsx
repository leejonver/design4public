import { fireEvent, render, screen, within } from "@testing-library/react";
import { ItemsView } from "@/app/(site)/items/items-view";
import type { ItemSummary } from "@/lib/types";

const item = (id: string, brand: string | null, category: string): ItemSummary => ({
  id, slug: id, name: id, brandSlug: brand, brandName: brand, brandNameEn: null,
  categories: [category], description: null, naraUrl: null, image: null, updatedAt: "",
});

it("combines brand and category filters and resets category when changing brand", () => {
  render(<ItemsView items={[item("a-chair", "A", "Chair"), item("a-desk", "A", "Desk"), item("b-table", "B", "Table"), item("unbranded", null, "Chair")]} categories={["Chair", "Desk", "Table"]} count={4} />);
  const brands = within(screen.getByRole("group", { name: "브랜드 필터" }));
  const categories = within(screen.getByRole("group", { name: "카테고리 필터" }));
  fireEvent.click(brands.getByRole("button", { name: "A" }));
  expect(screen.queryByRole("link", { name: /b-table/ })).not.toBeInTheDocument();
  expect(categories.queryByRole("button", { name: "Table" })).not.toBeInTheDocument();
  fireEvent.click(categories.getByRole("button", { name: "Desk" }));
  expect(screen.getByRole("link", { name: /a-desk/ })).toBeVisible();
  expect(screen.queryByRole("link", { name: /a-chair/ })).not.toBeInTheDocument();
  fireEvent.click(brands.getByRole("button", { name: "B" }));
  expect(screen.getByRole("link", { name: /b-table/ })).toBeVisible();
  fireEvent.click(brands.getByRole("button", { name: "All" }));
  expect(screen.getByRole("link", { name: /unbranded/ })).toBeVisible();
  expect(screen.getByRole("link", { name: /a-chair/ })).toBeVisible();
});

it("lets the mobile filter panel expand and collapse without clearing selection", () => {
  const { container } = render(<ItemsView items={[item("a-chair", "A", "Chair")]} categories={["Chair"]} count={1} />);
  const toggle = screen.getByRole("button", { name: "브랜드 · 카테고리 필터" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(within(screen.getByRole("group", { name: "브랜드 필터" })).getByRole("button", { name: "A" }));
  fireEvent.click(toggle);
  expect(container.querySelector("#item-filter-options")).toHaveAttribute("data-open", "false");
  expect(toggle).toHaveTextContent("A");
});
