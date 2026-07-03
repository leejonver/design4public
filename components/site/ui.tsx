"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Shared button styling (Button + ButtonLink)
   Dribbble-benchmarked: soft radius-control corners, medium
   weight, sentence case. Hover handled via client state since
   styling is inline (no global CSS).
   ============================================================ */
type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, { background: string; color: string; hover: string }> = {
  primary: { background: "var(--ink-900)", color: "#fff", hover: "#000" },
  secondary: { background: "var(--ink-100)", color: "var(--ink-900)", hover: "var(--ink-200)" },
  ghost: { background: "transparent", color: "var(--ink-700)", hover: "var(--ink-50)" },
  inverse: { background: "#fff", color: "var(--ink-900)", hover: "var(--ink-50)" },
};

const SIZES: Record<Size, { padding: string; fontSize: number }> = {
  sm: { padding: "8px 14px", fontSize: 13 },
  md: { padding: "11px 18px", fontSize: 14 },
  lg: { padding: "14px 22px", fontSize: 15 },
};

function buttonStyle(
  variant: Variant,
  size: Size,
  hovered: boolean,
  disabled?: boolean,
): CSSProperties {
  const v = VARIANTS[variant];
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    lineHeight: 1.2,
    border: "none",
    borderRadius: "var(--radius-control)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    background: hovered && !disabled ? v.hover : v.background,
    color: v.color,
    whiteSpace: "nowrap",
    transition:
      "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
    ...SIZES[size],
  };
}

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  onClick,
  type = "button",
  disabled,
  className,
  children,
}: {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(className)}
      style={buttonStyle(variant, size, hovered, disabled)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  className,
  target,
  rel,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={cn(className)}
      style={buttonStyle(variant, size, hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}

/* ============================================================
   IconButton — round/soft light-grey or bare icon control
   ============================================================ */
type IconVariant = "default" | "bare" | "circle";

const ICON_VARIANTS: Record<IconVariant, { bg: string; hover: string }> = {
  default: { bg: "var(--ink-50)", hover: "var(--ink-100)" },
  circle: { bg: "var(--ink-50)", hover: "var(--ink-100)" },
  bare: { bg: "transparent", hover: "var(--ink-50)" },
};

export function IconButton({
  label,
  variant = "default",
  size = "md",
  active,
  onClick,
  children,
}: {
  label: string;
  variant?: IconVariant;
  size?: "sm" | "md";
  active?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const dim = size === "sm" ? 34 : 40;
  const v = ICON_VARIANTS[variant];
  const background = active ? "var(--ink-900)" : hovered ? v.hover : v.bg;
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        width: dim,
        height: dim,
        border: "none",
        cursor: "pointer",
        borderRadius: variant === "circle" ? "var(--radius-pill)" : "var(--radius-control)",
        background,
        color: active ? "#fff" : "var(--ink-700)",
        transition:
          "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

/* ============================================================
   FilterChip — pill toggle
   ============================================================ */
export function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const background = selected ? "var(--ink-900)" : hovered ? "var(--ink-100)" : "var(--ink-50)";
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        padding: "7px 14px",
        borderRadius: "var(--radius-pill)",
        border: "1px solid transparent",
        cursor: "pointer",
        whiteSpace: "nowrap",
        background,
        color: selected ? "#fff" : "var(--ink-700)",
        transition:
          "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

/* ============================================================
   Input — labelled text field (onChange passes the VALUE)
   ============================================================ */
export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  name,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  name?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ display: "block" }}>
      {label ? (
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-sans)",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "var(--ink-400)",
            marginBottom: 8,
          }}
        >
          {label}
        </span>
      ) : null}
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#fff",
          border: `1px solid ${focused ? "var(--ink-900)" : "var(--border-line)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "11px 13px",
          fontSize: 14.5,
          fontFamily: "var(--font-sans)",
          color: "var(--ink-900)",
          outline: "none",
          transition: "border-color var(--dur-base) var(--ease-out)",
        }}
      />
    </label>
  );
}
