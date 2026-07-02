"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { Overline } from "@/components/site/primitives";
import { ButtonLink } from "@/components/site/ui";
import { ContactButton } from "@/components/site/contact-modal";
import type { ProjectDetail } from "@/lib/types";

export function ProjectMasthead({ project }: { project: ProjectDetail }) {
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
    const t = setInterval(() => setI((v) => (v + 1) % imgs.length), 6000);
    return () => clearInterval(t);
  }, [hover, imgs.length]);

  const overline = [...project.categories, project.year].filter(Boolean).join(" · ");
  const area = project.area != null ? `${project.area.toLocaleString()}㎡` : null;
  const rawFacts: [string, string | null][] = [
    ["위치", project.location],
    ["면적", area],
    ["분류", project.categories.join(" · ") || null],
  ];
  const facts = rawFacts.filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <div className="d4p-pmast">
      <div className="d4p-pmast-panel">
        <Overline>{overline}</Overline>
        <h1 className="d4p-pmast-title">{project.title}</h1>
        {project.client && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 14.5,
              color: "var(--ink-500)",
              marginTop: 10,
            }}
          >
            발주 · {project.client}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: "var(--sp-5)",
            paddingTop: "var(--sp-5)",
            borderTop: "1px solid var(--border-hair)",
          }}
        >
          {facts.map(([l, v]) => (
            <div key={l}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink-400)",
                }}
              >
                {l}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink-900)",
                  marginTop: 4,
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: "var(--sp-6)", alignItems: "center" }}>
          <ContactButton
            variant="primary"
            iconLeft={<Mail size={16} strokeWidth={1.5} />}
            projectSlug={project.slug}
          >
            문의하기
          </ContactButton>
          {project.inquiryUrl && (
            <ButtonLink
              variant="secondary"
              href={project.inquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              조달 정보 보기
            </ButtonLink>
          )}
        </div>
      </div>

      <div
        className="d4p-pmast-media"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="d4p-pmast-track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {imgs.map((src, idx) => (
            <div key={idx} className="d4p-pmast-slide">
              {src ? (
                <img src={src} alt="" />
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
        </div>
        {imgs.length > 1 && (
          <div className="d4p-pmast-count">
            {String(i + 1).padStart(2, "0")}{" "}
            <span style={{ opacity: 0.5 }}>/ {String(imgs.length).padStart(2, "0")}</span>
          </div>
        )}
      </div>

      {imgs.length > 1 && (
        <div className="d4p-pmast-nav">
          <button onClick={() => go(-1)} aria-label="이전 사진">
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button onClick={() => go(1)} aria-label="다음 사진">
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
