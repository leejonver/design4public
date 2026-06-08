/* DESIGN4PUBLIC — page chrome: breadcrumb, page hero, sticky filter bar */

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/d4p/primitives";

type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-400)", flexWrap: "wrap" }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <span style={{ color: "var(--ink-300)" }}>/</span>}
            {it.href && !last ? (
              <Link href={it.href} style={{ color: "var(--ink-500)" }}>{it.label}</Link>
            ) : (
              <span style={{ color: last ? "var(--ink-700)" : "var(--ink-500)" }}>{it.label}</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

export function PageHero({ breadcrumb, title, count, lead }: { breadcrumb?: Crumb[]; title: string; count?: number; lead?: string }) {
  return (
    <section style={{ borderBottom: "1px solid var(--border-hair)" }}>
      <Container style={{ padding: "var(--sp-5) var(--gutter) var(--sp-4)" }}>
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginTop: breadcrumb ? 10 : 0 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)", letterSpacing: "0.01em", textTransform: "uppercase", color: "var(--ink-900)", margin: 0 }}>{title}</h1>
          {count != null && (
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-500)", whiteSpace: "nowrap", paddingBottom: 4, flex: "none" }}>
              <strong style={{ color: "var(--ink-900)", fontWeight: 700 }}>{count.toLocaleString()}</strong>개
            </span>
          )}
        </div>
        {lead && <p style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--ink-500)", margin: "7px 0 0", maxWidth: "54ch", lineHeight: 1.5 }}>{lead}</p>}
      </Container>
    </section>
  );
}

export function FilterBar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{
      position: "sticky", top: "var(--header-h)", zIndex: 40,
      background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border-hair)",
    }}>
      <Container className="d4p-filterbar" style={{ padding: "11px var(--gutter)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, overflowX: "auto" }}>{left}</div>
        {right && <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>{right}</div>}
      </Container>
    </div>
  );
}
