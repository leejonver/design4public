"use client";

/* DESIGN4PUBLIC — appear-on-scroll compact title bar for detail/legal pages */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Container } from "@/components/d4p/primitives";

export function StickyTitle({
  title,
  meta,
  actions,
  threshold = 240,
}: {
  title: string;
  meta?: string;
  actions?: ReactNode;
  threshold?: number;
}) {
  const [show, setShow] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    const read = () => {
      const y = window.scrollY || 0;
      // hysteresis: reveal past the threshold, hide only well before it
      const next = shown.current ? y > threshold - 80 : y > threshold;
      if (next !== shown.current) {
        shown.current = next;
        setShow(next);
      }
    };
    window.addEventListener("scroll", read, { passive: true });
    read();
    return () => window.removeEventListener("scroll", read);
  }, [threshold]);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: "var(--header-h)",
        zIndex: 45,
        background: "rgba(255,255,255,.9)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border-hair)",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(-6px)",
        pointerEvents: show ? "auto" : "none",
        willChange: "opacity, transform",
        transition: "opacity 180ms var(--ease-out), transform 180ms var(--ease-out)",
      }}
    >
      <Container
        style={{
          padding: "10px var(--gutter)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--ink-900)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
          {meta && (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11.5,
                color: "var(--ink-500)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {meta}
            </div>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>{actions}</div>
        )}
      </Container>
    </div>
  );
}
