/* DESIGN4PUBLIC — site footer (dark, minimal, low height) */

import type { CSSProperties } from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Container } from "@/components/site/primitives";

const link: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 14.5,
  color: "rgba(255,255,255,.78)",
};
const hair = "1px solid rgba(255,255,255,.12)";

export function SiteFooter() {
  return (
    <footer style={{ background: "var(--ink-900)", borderTop: hair, marginTop: "var(--sp-8)" }}>
      <Container
        style={{
          padding: "var(--sp-6) var(--gutter)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 40,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          className="d4p-logotype"
          style={{ fontSize: 17.5, color: "var(--white)", flex: "none" }}
        >
          DESIGN<span style={{ color: "var(--sage-400)" }}>4</span>PUBLIC
        </Link>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "var(--sp-4)",
            maxWidth: "46ch",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 14.5,
              lineHeight: 1.6,
              color: "rgba(255,255,255,.52)",
              margin: 0,
              textAlign: "right",
              wordBreak: "keep-all",
            }}
          >
            디자인포퍼블릭은 대한민국의 공공조달 가구납품사례들을 모아놓은 공공 디자인 카탈로그
            서비스입니다.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <a
              href="mailto:d4p@design4public.com"
              style={{ ...link, display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Mail size={16} strokeWidth={1.5} style={{ color: "rgba(255,255,255,.45)" }} />
              d4p@design4public.com
            </a>
            <a
              href="tel:0315992662"
              style={{ ...link, display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Phone size={16} strokeWidth={1.5} style={{ color: "rgba(255,255,255,.45)" }} />
              031 599 2662
            </a>
          </div>
        </div>
      </Container>

      <div style={{ borderTop: hair }}>
        <Container
          style={{
            padding: "14px var(--gutter)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "rgba(255,255,255,.4)" }}
          >
            © 2026 DESIGN4PUBLIC. All rights reserved.
          </span>
          <nav style={{ display: "flex", gap: 18 }}>
            <Link href="/privacy" style={link}>
              개인정보처리방침
            </Link>
            <Link href="/terms" style={link}>
              이용약관
            </Link>
          </nav>
        </Container>
      </div>
    </footer>
  );
}
