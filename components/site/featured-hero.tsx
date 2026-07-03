"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/site/ui";
import type { ProjectDetail } from "@/lib/types";

export function FeaturedHero({ project }: { project: ProjectDetail }) {
  const imgs = project.gallery.length
    ? project.gallery.map((g) => g.url)
    : [project.coverImage];

  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const go = useCallback(
    (d: number) => setI((v) => (v + d + imgs.length) % imgs.length),
    [imgs.length],
  );

  useEffect(() => {
    if (hover || imgs.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % imgs.length), 5000);
    return () => clearInterval(t);
  }, [hover, imgs.length]);

  const overline = [...project.categories, project.year].filter(Boolean).join(" · ");
  const area = project.area != null ? `${project.area.toLocaleString()}㎡` : null;
  const meta = [project.client, project.location, area].filter(Boolean).join(" · ");

  return (
    <div
      className="d4p-hero"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {imgs.map((src, idx) => (
        <div key={idx} className="d4p-hero-slide" style={{ opacity: idx === i ? 1 : 0 }}>
          {src ? (
            /* eslint-disable-next-line @next/next/no-img-element -- remote, dynamic-aspect Supabase storage image rendered CSS-fill; next/image (fill) would change the tuned layout. */
            <img
              src={src}
              alt=""
              style={{ transform: idx === i ? "scale(1.06)" : "scale(1)" }}
            />
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
                fontSize: "2rem",
              }}
            >
              {project.title.charAt(0) || "DESIGN4PUBLIC"}
            </div>
          )}
        </div>
      ))}
      <div className="d4p-hero-scrim" />

      <div className="d4p-hero-tag">
        <span
          style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sage-300)" }}
        />
        FEATURED PROJECT
      </div>

      <div className="d4p-hero-body">
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.82)",
          }}
        >
          {overline}
        </div>
        <h1 className="d4p-hero-title">{project.title}</h1>
        {meta && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              color: "rgba(255,255,255,.8)",
              marginTop: 10,
            }}
          >
            {meta}
          </div>
        )}
        <div style={{ marginTop: 26 }}>
          <ButtonLink
            variant="inverse"
            size="lg"
            iconRight={<ArrowRight size={18} strokeWidth={1.5} />}
            href={`/projects/${project.slug}`}
          >
            프로젝트 자세히 보기
          </ButtonLink>
        </div>
      </div>

      {imgs.length > 1 && (
        <div className="d4p-hero-controls">
          <span className="d4p-hero-counter">
            {String(i + 1).padStart(2, "0")}{" "}
            <span style={{ opacity: 0.55 }}>/ {String(imgs.length).padStart(2, "0")}</span>
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="d4p-hero-arrow" onClick={() => go(-1)} aria-label="이전 사진">
              <ArrowLeft size={18} strokeWidth={1.5} />
            </button>
            <button className="d4p-hero-arrow" onClick={() => go(1)} aria-label="다음 사진">
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {imgs.length > 1 && (
        <div className="d4p-hero-dots">
          {imgs.map((_, idx) => (
            <button
              key={idx}
              aria-label={`${idx + 1}번 사진`}
              onClick={() => setI(idx)}
              className="d4p-hero-dot"
              data-active={idx === i ? "1" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
