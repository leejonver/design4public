"use client";

import { FilterChip } from "@/components/site/ui";

export function FacetRow({ chips, value, onChange }: { chips: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="d4p-facet-row" role="group" aria-label="카테고리 필터">
      {chips.map((c) => (
        <FilterChip key={c} selected={value === c} onClick={() => onChange(c)}>{c}</FilterChip>
      ))}
    </div>
  );
}
