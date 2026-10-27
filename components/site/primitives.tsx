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
        fontSize: "var(--fs-label)",
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
