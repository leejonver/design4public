/* DESIGN4PUBLIC — Legal pages (개인정보처리방침 / 이용약관) */

import Link from "next/link";
import { PageHero } from "@/components/d4p/page-chrome";
import { StickyTitle } from "@/components/d4p/sticky-title";

type Kind = "privacy" | "terms";

const META: Record<Kind, { title: string; lead: string; sections: [string, string][] }> = {
  privacy: {
    title: "개인정보처리방침",
    lead: "DESIGN4PUBLIC은 이용자의 개인정보를 중요하게 생각하며, 관련 법령에 따라 안전하게 관리합니다.",
    sections: [
      ["1. 수집하는 개인정보 항목", "서비스 문의 및 회원 운영을 위해 이름, 이메일, 연락처 등 최소한의 정보를 수집합니다."],
      ["2. 개인정보의 수집 및 이용 목적", "문의 응대, 프로젝트·아이템 정보 제공, 서비스 개선을 위한 통계 분석에 이용합니다."],
      ["3. 개인정보의 보유 및 이용 기간", "수집 목적이 달성된 후에는 관련 법령이 정한 기간을 제외하고 지체 없이 파기합니다."],
      ["4. 개인정보의 제3자 제공", "이용자의 동의가 있거나 법령에 근거가 있는 경우를 제외하고 외부에 제공하지 않습니다."],
      ["5. 이용자의 권리와 행사 방법", "이용자는 언제든지 본인의 개인정보 열람·정정·삭제를 요청할 수 있습니다."],
      ["6. 개인정보 보호책임자", "개인정보 관련 문의는 privacy@design4public.kr 로 접수할 수 있습니다."],
    ],
  },
  terms: {
    title: "이용약관",
    lead: "본 약관은 DESIGN4PUBLIC 서비스 이용에 관한 기본적인 사항을 규정합니다.",
    sections: [
      ["제1조 (목적)", "본 약관은 회사가 제공하는 카탈로그 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다."],
      ["제2조 (정의)", "‘서비스’란 회사가 제공하는 프로젝트·아이템·브랜드·포토 카탈로그 및 관련 부가 서비스를 말합니다."],
      ["제3조 (약관의 효력 및 변경)", "본 약관은 서비스 화면에 게시함으로써 효력이 발생하며, 관련 법령을 위배하지 않는 범위에서 변경될 수 있습니다."],
      ["제4조 (서비스의 제공)", "회사는 안정적인 서비스 제공을 위해 노력하며, 운영상·기술상 필요에 따라 서비스 내용을 변경할 수 있습니다."],
      ["제5조 (게시물의 저작권)", "서비스 내 이미지 및 콘텐츠의 저작권은 각 권리자에게 있으며, 무단 복제·배포를 금합니다."],
      ["제6조 (면책 조항)", "회사는 천재지변 등 불가항력으로 서비스를 제공할 수 없는 경우 책임이 면제됩니다."],
    ],
  },
};

export function LegalPage({ kind }: { kind: Kind }) {
  const meta = META[kind];
  const other = kind === "privacy" ? "terms" : "privacy";
  const otherLabel = kind === "privacy" ? "이용약관 보기 →" : "개인정보처리방침 보기 →";

  return (
    <div>
      <PageHero
        breadcrumb={[{ label: "홈", href: "/" }, { label: meta.title }]}
        title={meta.title}
        lead={meta.lead}
      />
      <StickyTitle title={meta.title} threshold={220} />
      <div
        style={{
          maxWidth: "var(--container-narrow)",
          margin: "0 auto",
          padding: "var(--sp-7) var(--gutter) var(--sp-9)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12.5,
            color: "var(--ink-400)",
            marginBottom: "var(--sp-6)",
          }}
        >
          최종 개정일 · 2026.01.01
        </div>
        {meta.sections.map(([h, body], i) => (
          <section key={i} style={{ marginBottom: "var(--sp-6)" }}>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--ink-900)",
                margin: 0,
              }}
            >
              {h}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                lineHeight: 1.75,
                color: "var(--ink-600)",
                margin: "12px 0 0",
              }}
            >
              {body}
            </p>
          </section>
        ))}
        <div
          style={{
            borderTop: "1px solid var(--border-hair)",
            paddingTop: "var(--sp-5)",
            marginTop: "var(--sp-7)",
          }}
        >
          <Link
            href={`/${other}`}
            style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-700)" }}
          >
            {otherLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
