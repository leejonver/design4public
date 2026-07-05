import type { CSSProperties, ReactNode } from "react";

/* ============================================================
   Container — max-width content column with fluid gutters
   ============================================================ */
export function Container({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        maxWidth: "var(--container)",
        margin: "0 auto",
        padding: "0 var(--gutter)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   Overline — tracked uppercase brand device
   ============================================================ */
export function Overline({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span className="d4p-overline" style={style}>
      {children}
    </span>
  );
}

/* ============================================================
   Badge — small neutral pill
   ============================================================ */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <small
      style={{
        display: "inline-block",
        background: "var(--ink-50)",
        color: "var(--ink-700)",
        fontSize: 12.5,
        borderRadius: "var(--radius-pill)",
        padding: "5px 11px",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </small>
  );
}

/* ============================================================
   SpecSheet — labelled spec rows
   ============================================================ */
export function SpecSheet({
  title,
  rows,
}: {
  title?: string;
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <div>
      {title ? (
        <Overline style={{ display: "block", marginBottom: 12 }}>{title}</Overline>
      ) : null}
      <div className="d4p-spec">
        {rows.map((row, i) => (
          <div className="d4p-spec-row" key={i}>
            <span className="d4p-spec-label">{row.label}</span>
            <span className="d4p-spec-value">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   CategoryPills — flex-wrap row of neutral Badges
   ============================================================ */
export function CategoryPills({ categories }: { categories: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {categories.map((c) => (
        <Badge key={c}>{c}</Badge>
      ))}
    </div>
  );
}
