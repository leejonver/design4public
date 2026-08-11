"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

type ButtonContent = {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  onClick,
  type = "button",
  disabled,
  children,
}: ButtonContent & {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="d4p-button"
      data-variant={variant}
      data-size={size}
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
  target,
  rel,
  children,
}: ButtonContent & {
  href: string;
  target?: string;
  rel?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className="d4p-button"
      data-variant={variant}
      data-size={size}
    >
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}

export function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="d4p-filter-chip"
      aria-pressed={selected ?? false}
      data-selected={selected ? "1" : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

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
  return (
    <label className="d4p-field">
      {label ? <span>{label}</span> : null}
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
