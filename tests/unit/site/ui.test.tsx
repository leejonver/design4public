import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, FilterChip } from "@/components/site/ui";

describe("site button semantics", () => {
  it("keeps explicit submit behavior while non-submit controls stay out of form submission", () => {
    render(
      <form>
        <Button>Cancel</Button>
        <Button type="submit">Save</Button>
        <FilterChip selected>Office</FilterChip>
        <FilterChip>All</FilterChip>
      </form>,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("button", { name: "Office" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Office" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Office" })).toHaveAttribute("data-selected", "1");
    expect(screen.getByRole("button", { name: "All" })).not.toHaveAttribute("data-selected");
  });
});
