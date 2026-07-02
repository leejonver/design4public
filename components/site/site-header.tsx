"use client";

/* DESIGN4PUBLIC — site header (sticky; responsive desktop / mobile) */

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, ArrowUpRight } from "lucide-react";
import type { SearchIndex } from "@/lib/types";
import { BrandSearch } from "@/components/site/brand-search";
import { ContactButton } from "@/components/site/contact-modal";

const NAV_ITEMS = [
  { href: "/projects", label: "Projects" },
  { href: "/items", label: "Items" },
  { href: "/photos", label: "Photos" },
  { href: "/brands", label: "Brands" },
];

const SEARCH_PLACEHOLDER = "프로젝트, 아이템, 브랜드 검색";

export function SiteHeader({ index }: { index: SearchIndex }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [y, setY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // window scroll → blur background once past 8px
  useEffect(() => {
    const fn = () => setY(window.scrollY || 0);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // responsive switch at 860px
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // scroll-lock while an overlay is open
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen, searchOpen]);

  // close overlays on navigation
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const scrolled = y > 8;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const Logo = ({ size = 16 }: { size?: number }) => (
    <Link
      href="/"
      aria-label="DESIGN4PUBLIC home"
      style={{ display: "flex", alignItems: "center", flex: "none" }}
    >
      <span className="d4p-logotype" style={{ fontSize: size }}>
        DESIGN<span style={{ color: "var(--brand)" }}>4</span>PUBLIC
      </span>
    </Link>
  );

  const headerStyle: CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 60,
    background: scrolled ? "rgba(255,255,255,.82)" : "var(--white)",
    backdropFilter: scrolled ? "blur(12px)" : "none",
    WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
    borderBottom: "1px solid var(--border-hair)",
    transition: "background var(--dur-base) var(--ease-out)",
  };
  const barInner: CSSProperties = {
    maxWidth: "var(--container)",
    margin: "0 auto",
    height: "var(--header-h)",
    padding: "0 var(--gutter)",
    display: "flex",
    alignItems: "center",
  };

  /* ----- Mobile: [search] · logo · [menu] ----- */
  if (isMobile) {
    return (
      <>
        <header style={headerStyle}>
          <div style={{ ...barInner, justifyContent: "space-between", gap: 12 }}>
            <button onClick={() => setSearchOpen(true)} aria-label="검색" style={iconBtn}>
              <Search size={18} strokeWidth={1.5} />
            </button>
            <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
              <Logo size={14} />
            </div>
            <button onClick={() => setMenuOpen(true)} aria-label="메뉴" style={iconBtn}>
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {searchOpen && (
          <div style={overlay} onClick={() => setSearchOpen(false)}>
            <div
              style={{ ...sheet, padding: "var(--sp-5) var(--gutter)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <BrandSearch index={index} size="lg" placeholder={SEARCH_PLACEHOLDER} />
                </div>
                <button onClick={() => setSearchOpen(false)} aria-label="닫기" style={iconBtn}>
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        )}

        {menuOpen && (
          <div style={overlay} onClick={() => setMenuOpen(false)}>
            <nav
              style={{ ...sheet, padding: "var(--sp-5) var(--gutter) var(--sp-6)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setMenuOpen(false)} aria-label="닫기" style={iconBtn}>
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
                {NAV_ITEMS.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: 30,
                      color: isActive(n.href) ? "var(--ink-900)" : "var(--ink-700)",
                      padding: "14px 0",
                      borderBottom: "1px solid var(--border-hair)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {n.label}
                    <ArrowUpRight size={22} strokeWidth={1.5} style={{ color: "var(--ink-300)" }} />
                  </Link>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginTop: "var(--sp-5)",
                  flexWrap: "wrap",
                }}
              >
                <ContactButton variant="ghost">문의하기</ContactButton>
                <Link href="/privacy" style={mLink}>
                  개인정보처리방침
                </Link>
                <Link href="/terms" style={mLink}>
                  이용약관
                </Link>
              </div>
            </nav>
          </div>
        )}
      </>
    );
  }

  /* ----- Desktop: logo · [center search · nav] ----- */
  return (
    <header style={headerStyle}>
      <div style={{ ...barInner, gap: 24 }}>
        <Logo size={16} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", height: "100%" }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 24px" }}>
            <div style={{ width: "100%", maxWidth: 480 }}>
              <BrandSearch index={index} placeholder={SEARCH_PLACEHOLDER} />
            </div>
          </div>
          <nav style={{ display: "flex", gap: 26, flex: "none" }}>
            {NAV_ITEMS.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: active ? "var(--ink-900)" : "var(--ink-400)",
                    borderBottom: `1.5px solid ${active ? "var(--ink-900)" : "transparent"}`,
                    paddingBottom: 4,
                    transition: "color var(--dur-base) var(--ease-out)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = "var(--ink-700)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = "var(--ink-400)";
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

const iconBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  border: "none",
  background: "transparent",
  color: "var(--ink-800)",
  cursor: "pointer",
  flex: "none",
  borderRadius: "var(--radius-control)",
};
const mLink: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 13.5,
  color: "var(--ink-500)",
};
const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 70,
  background: "rgba(20,20,20,.32)",
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  animation: "d4pFade var(--dur-base) var(--ease-out)",
};
const sheet: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  background: "var(--white)",
  borderBottom: "1px solid var(--border-hair)",
  boxShadow: "var(--shadow-md)",
  animation: "d4pSlideDown var(--dur-base) var(--ease-out)",
};
