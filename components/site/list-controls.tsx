"use client";

/* DESIGN4PUBLIC — shared list controls (sort, view toggle, facet chips, filter) */

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { FilterChip, Button, IconButton } from "@/components/site/ui";

export function SortMenu({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button onClick={() => setOpen((o) => !o)} style={{
        display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer",
        fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-800)",
        background: "transparent", border: "none", padding: "6px 2px", whiteSpace: "nowrap",
      }}>
        <span style={{ color: "var(--ink-500)" }}>정렬</span>
        <strong style={{ fontWeight: 600 }}>{value}</strong>
        <ChevronDown size={15} strokeWidth={1.5} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--white)", border: "1px solid var(--border-hair)", borderRadius: "var(--radius-control)", boxShadow: "var(--shadow-md)", padding: 6, minWidth: 140, zIndex: 50 }}>
          {options.map((s) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }} style={{
              display: "block", width: "100%", textAlign: "left", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: 13.5, padding: "9px 11px",
              background: s === value ? "var(--ink-50)" : "transparent", border: "none",
              borderRadius: 6, color: "var(--ink-800)", fontWeight: s === value ? 600 : 400,
            }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ViewToggle({ view, onView }: { view: "grid" | "list"; onView: (v: "grid" | "list") => void }) {
  return (
    <span className="d4p-viewtoggle" style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <Divider />
      <IconButton label="그리드" variant="bare" active={view === "grid"} size="sm" onClick={() => onView("grid")}><LayoutGrid size={18} strokeWidth={1.5} /></IconButton>
      <IconButton label="리스트" variant="bare" active={view === "list"} size="sm" onClick={() => onView("list")}><List size={18} strokeWidth={1.5} /></IconButton>
    </span>
  );
}

export function FacetRow({ chips, value, onChange }: { chips: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <>
      {chips.map((c) => (
        <FilterChip key={c} selected={value === c} onClick={() => onChange(c)}>{c}</FilterChip>
      ))}
    </>
  );
}

export function FilterButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick} iconLeft={<SlidersHorizontal size={15} strokeWidth={1.5} />}>필터</Button>
  );
}

export function Divider() {
  return <span style={{ width: 1, height: 22, background: "var(--border-hair)", flex: "none" }} />;
}
