"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ArrowRight,
  ArrowUpRight,
  LayoutGrid,
  Armchair,
  Store,
  Image as ImageIcon,
} from "lucide-react";
import type { SearchIndex } from "@/lib/types";

type ProjectHit = SearchIndex["projects"][number];
type ItemHit = SearchIndex["items"][number];
type BrandHit = SearchIndex["brands"][number];

type Option =
  | { kind: "run"; label: string }
  | { kind: "project"; data: ProjectHit }
  | { kind: "item"; data: ItemHit }
  | { kind: "brand"; data: BrandHit };

const POPULAR = ["라운지 소파", "태스크 체어", "공공 프로젝트", "포커스 부스", "모듈 소파"];

const CATS = [
  { key: "projects", label: "프로젝트", href: "/projects", Icon: LayoutGrid },
  { key: "items", label: "아이템", href: "/items", Icon: Armchair },
  { key: "brands", label: "브랜드", href: "/brands", Icon: Store },
  { key: "photos", label: "포토", href: "/photos", Icon: ImageIcon },
] as const;

function joinMeta(parts: (string | number | null | undefined)[]): string {
  return parts.filter((p) => p !== null && p !== undefined && p !== "").join(" · ");
}

function Thumb({ img, title, square }: { img: string | null; title: string; square?: boolean }) {
  return (
    <span className="d4p-srch-thumb" style={{ borderRadius: square ? "var(--radius-pill)" : "var(--radius-sm)" }}>
      {img ? (
        <img src={img} alt="" loading="lazy" />
      ) : (
        <span
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink-400)",
          }}
        >
          {title.charAt(0) || "D"}
        </span>
      )}
    </span>
  );
}

function ResultRow({
  img,
  brand,
  title,
  meta,
  active,
  onClick,
  square,
}: {
  img: string | null;
  brand?: string | null;
  title: string;
  meta?: string;
  active?: boolean;
  onClick: () => void;
  square?: boolean;
}) {
  return (
    <button
      className="d4p-srch-row"
      data-active={active ? "1" : undefined}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Thumb img={img} title={title} square={square} />
      <span style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
        {brand && (
          <span
            style={{
              display: "block",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-400)",
            }}
          >
            {brand}
          </span>
        )}
        <span
          style={{
            display: "block",
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--ink-900)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        {meta && (
          <span
            style={{
              display: "block",
              fontSize: 11.5,
              color: "var(--ink-500)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {meta}
          </span>
        )}
      </span>
      <ArrowUpRight size={15} strokeWidth={1.5} style={{ color: "var(--ink-300)", flex: "none" }} />
    </button>
  );
}

export function BrandSearch({
  index,
  size = "md",
  placeholder = "프로젝트, 아이템, 브랜드 검색",
}: {
  index: SearchIndex;
  size?: "md" | "lg";
  placeholder?: string;
}) {
  const { projects, items, brands } = index;
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hi, setHi] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lg = size === "lg";
  const active = focus || !!q;

  const ql = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!ql) return null;
    const has = (s: string | null | undefined) => !!s && s.toLowerCase().includes(ql);
    return {
      projects: projects
        .filter((p) => has(p.title) || has(p.location) || p.categories.some(has))
        .slice(0, 3),
      items: items
        .filter((i) => has(i.name) || has(i.brandName) || i.categories.some(has))
        .slice(0, 4),
      brands: brands.filter((b) => has(b.nameKo) || has(b.nameEn)).slice(0, 3),
    };
  }, [ql, projects, items, brands]);

  const options = useMemo<Option[]>(() => {
    if (!ql || !results) return [];
    const o: Option[] = [{ kind: "run", label: q }];
    results.projects.forEach((p) => o.push({ kind: "project", data: p }));
    results.items.forEach((i) => o.push({ kind: "item", data: i }));
    results.brands.forEach((b) => o.push({ kind: "brand", data: b }));
    return o;
  }, [ql, results, q]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocus(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => {
    setHi(-1);
  }, [ql]);

  const choose = (opt?: Option) => {
    setOpen(false);
    setFocus(false);
    inputRef.current?.blur();
    if (!opt || opt.kind === "run") {
      router.push(`/projects?q=${encodeURIComponent(q.trim())}`);
      return;
    }
    if (opt.kind === "project") router.push(`/projects/${opt.data.slug}`);
    else if (opt.kind === "item") router.push(`/items/${opt.data.slug}`);
    else if (opt.kind === "brand") router.push(`/brands/${opt.data.slug}`);
    setQ("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(hi >= 0 ? options[hi] : options[0] ?? { kind: "run", label: q });
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        className="d4p-brand-search"
        data-focus={focus ? "1" : undefined}
        style={{
          height: lg ? 56 : 46,
          paddingLeft: lg ? 18 : 15,
          background: focus ? "var(--white)" : "var(--ink-50)",
          border: `1px solid ${focus ? "var(--sage-300)" : "transparent"}`,
          boxShadow: focus ? "0 0 0 4px rgba(98,113,84,.16)" : "none",
        }}
      >
        <Search
          className="d4p-srch-icon"
          size={lg ? 20 : 18}
          strokeWidth={1.5}
          style={{ color: focus ? "var(--sage-600)" : "var(--ink-400)" }}
        />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocus(true);
            setOpen(true);
          }}
          onKeyDown={onKey}
          placeholder={placeholder}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: lg ? 16 : 14.5,
            color: "var(--ink-900)",
          }}
        />
        {q && (
          <button
            className="d4p-srch-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            aria-label="지우기"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        )}
        <button
          className="d4p-srch-go"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => choose(options[0] ?? { kind: "run", label: q })}
          aria-label="검색"
          style={{
            width: lg ? 44 : 36,
            height: lg ? 44 : 36,
            background: active ? "var(--sage-600)" : "var(--ink-200)",
            color: active ? "#fff" : "var(--ink-500)",
          }}
        >
          <ArrowRight size={lg ? 19 : 16} strokeWidth={1.5} />
        </button>
      </div>

      {open && (
        <div className="d4p-srch-panel">
          {!ql && (
            <>
              <div className="d4p-srch-sec">추천 검색어</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: "2px 10px 12px" }}>
                {POPULAR.map((t) => (
                  <button
                    key={t}
                    className="d4p-srch-chip"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQ(t);
                      inputRef.current?.focus();
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="d4p-srch-divider" />
              <div className="d4p-srch-sec">바로가기</div>
              <div style={{ padding: "2px 6px 6px" }}>
                {CATS.map((c) => (
                  <button
                    key={c.key}
                    className="d4p-srch-row"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setOpen(false);
                      setFocus(false);
                      router.push(c.href);
                    }}
                  >
                    <span className="d4p-srch-catico">
                      <c.Icon size={16} strokeWidth={1.5} />
                    </span>
                    <span style={{ flex: 1, textAlign: "left", fontSize: 13.5, fontWeight: 600, color: "var(--ink-800)" }}>
                      {c.label}
                    </span>
                    <ArrowUpRight size={15} strokeWidth={1.5} style={{ color: "var(--ink-300)" }} />
                  </button>
                ))}
              </div>
            </>
          )}

          {ql && results && (
            <>
              <button
                className="d4p-srch-row"
                data-active={hi < 0 || hi === 0 ? "1" : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose({ kind: "run", label: q })}
              >
                <span className="d4p-srch-catico">
                  <Search size={15} strokeWidth={1.5} />
                </span>
                <span style={{ flex: 1, textAlign: "left", fontSize: 13.5, color: "var(--ink-700)" }}>
                  ‘<strong style={{ color: "var(--ink-900)" }}>{q}</strong>’ 전체 검색
                </span>
              </button>

              {results.projects.length > 0 && <div className="d4p-srch-sec">프로젝트</div>}
              {results.projects.map((p) => {
                const idx = options.findIndex((o) => o.kind === "project" && o.data === p);
                return (
                  <ResultRow
                    key={p.slug}
                    img={p.image}
                    title={p.title}
                    meta={joinMeta([p.categories[0], p.year, p.location])}
                    active={hi === idx}
                    onClick={() => choose({ kind: "project", data: p })}
                  />
                );
              })}

              {results.items.length > 0 && <div className="d4p-srch-sec">아이템</div>}
              {results.items.map((it) => {
                const idx = options.findIndex((o) => o.kind === "item" && o.data === it);
                return (
                  <ResultRow
                    key={it.slug}
                    img={it.image}
                    brand={it.brandName}
                    title={it.name}
                    meta={joinMeta(it.categories)}
                    active={hi === idx}
                    onClick={() => choose({ kind: "item", data: it })}
                  />
                );
              })}

              {results.brands.length > 0 && <div className="d4p-srch-sec">브랜드</div>}
              {results.brands.map((b) => {
                const idx = options.findIndex((o) => o.kind === "brand" && o.data === b);
                return (
                  <ResultRow
                    key={b.slug}
                    img={b.image}
                    title={b.nameKo}
                    meta={b.nameEn ?? undefined}
                    active={hi === idx}
                    square
                    onClick={() => choose({ kind: "brand", data: b })}
                  />
                );
              })}

              {results.projects.length + results.items.length + results.brands.length === 0 && (
                <div style={{ padding: "22px 16px", textAlign: "center", color: "var(--ink-400)", fontSize: 13.5 }}>
                  검색 결과가 없습니다.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
