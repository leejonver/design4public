"use client";

import { FilterChip } from "@/components/site/ui";

export function FacetRow({ chips, value, onChange }: { chips: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <>
      {chips.map((c) => (
        <FilterChip key={c} selected={value === c} onClick={() => onChange(c)}>{c}</FilterChip>
      ))}
    </>
  );
}
