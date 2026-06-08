"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, X } from "lucide-react";
import { FilterChip } from "@/components/d4p/ui";
import { Overline, Badge } from "@/components/d4p/primitives";
import type { PhotoFeedItem } from "@/lib/types";

export function PhotosView({
  photos,
  categories,
}: {
  photos: PhotoFeedItem[];
  categories: string[];
}) {
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState<number | null>(null);

  const chips = ["All", ...categories];
  const list =
    filter === "All"
      ? photos
      : photos.filter((p) => p.projectCategories.includes(filter));

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "var(--sp-6)" }}>
        {chips.map((c) => (
          <FilterChip key={c} selected={filter === c} onClick={() => setFilter(c)}>
            {c}
          </FilterChip>
        ))}
      </div>

      <div className="d4p-masonry">
        {list.map((ph, idx) => {
          const caption = ph.title ?? ph.alt ?? ph.projectTitle;
          return (
            <button
              key={ph.id}
              onClick={() => setActive(idx)}
              className="d4p-photo-tile d4p-masonry-item"
              style={{ aspectRatio: idx % 7 === 6 ? "4 / 5" : "4 / 3" }}
            >
              {ph.url ? (
                <img src={ph.url} alt={ph.alt ?? ""} loading="lazy" />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--sunken)",
                    color: "var(--ink-400)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "1.7rem",
                  }}
                >
                  {(caption ?? "DESIGN4PUBLIC").charAt(0)}
                </div>
              )}
              {caption && <span className="d4p-photo-cap">{caption}</span>}
            </button>
          );
        })}
      </div>

      {active !== null && (
        <PhotoModal photos={list} initialIndex={active} onClose={() => setActive(null)} />
      )}
    </>
  );
}

function PhotoModal({
  photos,
  initialIndex,
  onClose,
}: {
  photos: PhotoFeedItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(initialIndex);
  const go = useCallback(
    (d: number) => setI((v) => (v + d + photos.length) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  const ph = photos[i];
  const title = ph.title ?? ph.alt ?? ph.projectTitle ?? "";
  const badges = [...ph.projectCategories, ph.year, ph.location].filter(Boolean) as (
    | string
    | number
  )[];

  return (
    <div className="d4p-modal-backdrop" onClick={onClose}>
      <div className="d4p-photo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="d4p-photo-stage">
          {ph.url ? (
            <img src={ph.url} alt={ph.alt ?? ""} />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                color: "rgba(255,255,255,.5)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "2rem",
              }}
            >
              {(title || "DESIGN4PUBLIC").charAt(0)}
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button
                className="d4p-nav-arrow"
                style={{ left: 16 }}
                onClick={() => go(-1)}
                aria-label="이전"
              >
                <ChevronLeft size={20} strokeWidth={1.5} />
              </button>
              <button
                className="d4p-nav-arrow"
                style={{ right: 16 }}
                onClick={() => go(1)}
                aria-label="다음"
              >
                <ChevronRight size={20} strokeWidth={1.5} />
              </button>
            </>
          )}
          <div className="d4p-photo-counter">
            {String(i + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
          </div>
        </div>

        <aside className="d4p-photo-side">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Overline>Photo</Overline>
            <button
              onClick={onClose}
              aria-label="닫기"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                border: "none",
                background: "transparent",
                color: "var(--ink-800)",
                cursor: "pointer",
                borderRadius: "var(--radius-control)",
              }}
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 22,
              color: "var(--ink-900)",
              margin: "14px 0 0",
            }}
          >
            {title}
          </h2>
          {badges.length > 0 && (
            <div style={{ display: "flex", gap: 8, margin: "14px 0 0", flexWrap: "wrap" }}>
              {badges.map((b, idx) => (
                <Badge key={idx}>{b}</Badge>
              ))}
            </div>
          )}
          {ph.projectSlug && (
            <Link href={`/projects/${ph.projectSlug}`} className="d4p-side-link" onClick={onClose}>
              <div>
                <span
                  style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)" }}
                >
                  프로젝트
                </span>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "var(--ink-900)",
                    marginTop: 3,
                  }}
                >
                  {ph.projectTitle}
                </div>
              </div>
              <ArrowRight size={18} strokeWidth={1.5} style={{ color: "var(--ink-400)", flex: "none" }} />
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
