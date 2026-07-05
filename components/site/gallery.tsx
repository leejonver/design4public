"use client";

/* DESIGN4PUBLIC — detail media: DetailHero slideshow + masonry Gallery with lightbox */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PhotoLite } from "@/lib/types";

export function DetailHero({
  images,
  ratio = "4 / 3",
}: {
  images: PhotoLite[];
  ratio?: string;
}) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div
        className="d4p-detailhero"
        style={{
          aspectRatio: ratio,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "1rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-400)",
          }}
        >
          DESIGN4PUBLIC
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="d4p-detailhero" style={{ aspectRatio: ratio }}>
        <div
          className="d4p-detailhero-track"
          style={{ transform: `translateX(-${active * 100}%)`, height: "100%" }}
        >
          {images.map((img, i) => (
            <div className="d4p-detailhero-slide" key={img.id}>
              <Image
                src={img.url}
                alt={img.alt ?? img.title ?? ""}
                fill
                sizes="(max-width:860px) 100vw, 60vw"
                style={{ objectFit: "cover" }}
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="d4p-detailhero-thumbs">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className="d4p-detailhero-thumb"
              data-active={i === active ? "" : undefined}
              onClick={() => setActive(i)}
              aria-label={`이미지 ${i + 1}`}
            >
              <Image src={img.url} alt="" fill sizes="60px" style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Gallery({
  images,
}: {
  images: PhotoLite[];
  /* column count is responsive via .d4p-masonry in globals.css; the
     `columns` prop is accepted for the documented component contract but not read here. */
  columns?: number;
}) {
  const [open, setOpen] = useState(-1);

  const close = useCallback(() => setOpen(-1), []);
  const prev = useCallback(
    () => setOpen((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setOpen((i) => (i + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (open < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, prev, next]);

  if (!images.length) return null;

  const current = open >= 0 ? images[open] : null;

  return (
    <>
      <div className="d4p-masonry">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            className="d4p-photo-tile d4p-masonry-item"
            onClick={() => setOpen(i)}
            aria-label={img.title ?? img.alt ?? `사진 ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- masonry tile has no determinate-size ancestor (height comes from this image's own intrinsic aspect ratio); next/image `fill` would collapse the tile to 0 height. */}
            <img src={img.url} alt={img.alt ?? img.title ?? ""} loading="lazy" />
            {img.title && <span className="d4p-photo-cap">{img.title}</span>}
          </button>
        ))}
      </div>

      {current && (
        <div
          className="d4p-modal-backdrop"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="사진 보기"
        >
          <button
            type="button"
            className="d4p-nav-arrow"
            style={{ top: 20, right: 20, transform: "none" }}
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="닫기"
          >
            <X size={20} strokeWidth={1.5} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="d4p-nav-arrow"
                style={{ left: 20 }}
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="이전 사진"
              >
                <ChevronLeft size={20} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                className="d4p-nav-arrow"
                style={{ right: 20 }}
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="다음 사진"
              >
                <ChevronRight size={20} strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element -- remote, dynamic-aspect Supabase storage image rendered CSS-fill; next/image (fill) would change the tuned layout. */}
          <img
            src={current.url}
            alt={current.alt ?? current.title ?? ""}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "86vh",
              objectFit: "contain",
              borderRadius: "var(--radius-sm)",
            }}
          />

          <span className="d4p-photo-counter">
            {String(open + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
        </div>
      )}
    </>
  );
}
