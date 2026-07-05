"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
import type { EntityType, SearchGroups, SearchHit } from "@/lib/search/query";

type Option = { kind: "run"; label: string } | { kind: "hit"; data: SearchHit };

const POPULAR = ["라운지 소파", "태스크 체어", "공공 프로젝트", "포커스 부스", "모듈 소파"];

const CATS = [
  { key: "projects", label: "프로젝트", href: "/projects", Icon: LayoutGrid },
  { key: "items", label: "아이템", href: "/items", Icon: Armchair },
  { key: "brands", label: "브랜드", href: "/brands", Icon: Store },
  { key: "photos", label: "포토", href: "/photos", Icon: ImageIcon },
] as const;

const SECTION_LABEL: Record<EntityType, string> = {
  project: "프로젝트",
  item: "아이템",
  brand: "브랜드",
  photo: "포토",
};
// Dropdown section order.
const SECTION_ORDER: EntityType[] = ["project", "item", "brand", "photo"];

const emptyGroups = (): SearchGroups => ({ project: [], item: [], brand: [], photo: [] });

function Thumb({ img, title, square }: { img: string | null; title: string; square?: boolean }) {
  return (
    <span className="d4p-srch-thumb" style={{ borderRadius: square ? "var(--radius-pill)" : "var(--radius-sm)" }}>
      {img ? (
        <Image src={img} alt="" fill sizes="42px" style={{ objectFit: "cover" }} />
      ) : (
        <span
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15.5,
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
  title,
  active,
  onClick,
  square,
}: {
  img: string | null;
  title: string;
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
        <span
          style={{
            display: "block",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink-900)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
      </span>
      <ArrowUpRight size={15} strokeWidth={1.5} style={{ color: "var(--ink-300)", flex: "none" }} />
    </button>
  );
}

export function BrandSearch({
  size = "md",
  placeholder = "프로젝트, 아이템, 브랜드 검색",
}: {
  size?: "md" | "lg";
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hi, setHi] = useState(-1);
  const [groups, setGroups] = useState<SearchGroups>(emptyGroups);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lg = size === "lg";
  const active = focus || !!q;
  const ql = q.trim();

  // Debounced fetch to /api/search. Aborts the in-flight request on each keystroke.
  useEffect(() => {
    if (!ql) {
      setGroups(emptyGroups());
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(ql)}`, { signal: controller.signal });
        const json = (await res.json()) as { groups: SearchGroups };
        setGroups(json.groups ?? emptyGroups());
      } catch {
        // aborted or network error — leave prior results, drop the spinner
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [ql]);

  const totalHits = SECTION_ORDER.reduce((n, k) => n + groups[k].length, 0);

  // Flat option list for keyboard nav: the "run" row first, then hits in section order.
  const options = useMemo<Option[]>(() => {
    if (!ql) return [];
    const o: Option[] = [{ kind: "run", label: ql }];
    for (const k of SECTION_ORDER) for (const hit of groups[k]) o.push({ kind: "hit", data: hit });
    return o;
  }, [ql, groups]);

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
      router.push(`/search?q=${encodeURIComponent(ql)}`);
      return;
    }
    router.push(opt.data.href);
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
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      choose(hi >= 0 ? options[hi] : options[0] ?? { kind: "run", label: ql });
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
            fontSize: lg ? 17.5 : 16,
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
          onClick={() => choose(options[0] ?? { kind: "run", label: ql })}
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
                    <span style={{ flex: 1, textAlign: "left", fontSize: 15, fontWeight: 600, color: "var(--ink-800)" }}>
                      {c.label}
                    </span>
                    <ArrowUpRight size={15} strokeWidth={1.5} style={{ color: "var(--ink-300)" }} />
                  </button>
                ))}
              </div>
            </>
          )}

          {ql && (
            <>
              <button
                className="d4p-srch-row"
                data-active={hi < 0 || hi === 0 ? "1" : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose({ kind: "run", label: ql })}
              >
                <span className="d4p-srch-catico">
                  <Search size={15} strokeWidth={1.5} />
                </span>
                <span style={{ flex: 1, textAlign: "left", fontSize: 15, color: "var(--ink-700)" }}>
                  ‘<strong style={{ color: "var(--ink-900)" }}>{ql}</strong>’ 전체 검색
                </span>
              </button>

              {SECTION_ORDER.map((sec) =>
                groups[sec].length > 0 ? (
                  <div key={sec}>
                    <div className="d4p-srch-sec">{SECTION_LABEL[sec]}</div>
                    {groups[sec].map((hit) => {
                      const idx = options.findIndex((o) => o.kind === "hit" && o.data === hit);
                      return (
                        <ResultRow
                          key={`${hit.entityType}-${hit.entityId}`}
                          img={hit.imageUrl}
                          title={hit.title}
                          active={hi === idx}
                          square={hit.entityType === "brand"}
                          onClick={() => choose({ kind: "hit", data: hit })}
                        />
                      );
                    })}
                  </div>
                ) : null,
              )}

              {!loading && totalHits === 0 && (
                <div style={{ padding: "22px 16px", textAlign: "center", color: "var(--ink-400)", fontSize: 15 }}>
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
