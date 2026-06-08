"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { Check, X } from "lucide-react";
import { Button, FilterChip, Input } from "@/components/d4p/ui";
import { Overline } from "@/components/d4p/primitives";

const INQUIRY_TYPES = ["프로젝트 문의", "아이템 문의", "브랜드 입점", "기타"];

const fieldLabelStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "var(--ink-400)",
};

/* ── Context ─────────────────────────────────────────────── */

type ContactContextValue = {
    open: (projectSlug?: string) => void;
    close: () => void;
    isOpen: boolean;
    projectSlug?: string;
};

const ContactContext = createContext<ContactContextValue | null>(null);

export function useContact() {
    const ctx = useContext(ContactContext);
    if (!ctx) {
        throw new Error("useContact must be used within a ContactModalProvider");
    }
    return { open: ctx.open, close: ctx.close };
}

export function ContactModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [projectSlug, setProjectSlug] = useState<string | undefined>(undefined);

    const open = useCallback((slug?: string) => {
        setProjectSlug(slug);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <ContactContext.Provider value={{ open, close, isOpen, projectSlug }}>
            {children}
            {isOpen && <ContactModal projectSlug={projectSlug} onClose={close} />}
        </ContactContext.Provider>
    );
}

/* ── Button ──────────────────────────────────────────────── */

export function ContactButton({
    variant,
    size,
    iconLeft,
    projectSlug,
    children,
}: {
    variant?: "primary" | "secondary" | "ghost" | "inverse";
    size?: "sm" | "md" | "lg";
    iconLeft?: ReactNode;
    projectSlug?: string;
    children: ReactNode;
}) {
    const { open } = useContact();
    return (
        <Button variant={variant} size={size} iconLeft={iconLeft} onClick={() => open(projectSlug)}>
            {children}
        </Button>
    );
}

/* ── Modal ───────────────────────────────────────────────── */

function ContactModal({
    projectSlug,
    onClose,
}: {
    projectSlug?: string;
    onClose: () => void;
}) {
    const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
    const [type, setType] = useState(INQUIRY_TYPES[0]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    const set = (key: keyof typeof form) => (val: string) =>
        setForm((f) => ({ ...f, [key]: val }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/inquiry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    phone: "",
                    company: form.company,
                    project_slug: projectSlug ?? "",
                    message: `[문의 유형] ${type}\n\n${form.message}`,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "문의 전송에 실패했습니다. 다시 시도해 주세요.");
            }
            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "문의 전송에 실패했습니다. 다시 시도해 주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="d4p-modal-backdrop" onClick={onClose}>
            <div className="d4p-contact-modal" onClick={(e) => e.stopPropagation()}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "var(--sp-5)",
                    }}
                >
                    <div>
                        <Overline>Contact</Overline>
                        <h2
                            style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 600,
                                fontSize: 24,
                                color: "var(--ink-900)",
                                margin: "10px 0 0",
                            }}
                        >
                            문의하기
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="닫기"
                        style={{
                            display: "inline-flex",
                            width: 38,
                            height: 38,
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            background: "transparent",
                            color: "var(--ink-800)",
                            cursor: "pointer",
                            borderRadius: "var(--radius-control)",
                        }}
                    >
                        <X width={20} height={20} strokeWidth={1.5} />
                    </button>
                </div>

                {sent ? (
                    <div style={{ padding: "var(--sp-7) 0", textAlign: "center" }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                background: "var(--sage-50)",
                                border: "1px solid var(--sage-200)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--brand)",
                            }}
                        >
                            <Check width={26} height={26} strokeWidth={1.5} />
                        </div>
                        <h3
                            style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 600,
                                fontSize: 19,
                                color: "var(--ink-900)",
                                margin: "18px 0 0",
                            }}
                        >
                            문의가 접수되었습니다
                        </h3>
                        <p
                            style={{
                                fontFamily: "var(--font-sans)",
                                fontSize: 14,
                                color: "var(--ink-500)",
                                margin: "8px 0 22px",
                            }}
                        >
                            빠른 시일 내에 입력하신 이메일로 회신드리겠습니다.
                        </p>
                        <Button variant="secondary" onClick={onClose}>
                            닫기
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "var(--sp-4)" }}>
                            <div style={{ ...fieldLabelStyle, marginBottom: 10 }}>문의 유형</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {INQUIRY_TYPES.map((t) => (
                                    <FilterChip key={t} selected={type === t} onClick={() => setType(t)}>
                                        {t}
                                    </FilterChip>
                                ))}
                            </div>
                        </div>
                        <div className="d4p-form-grid">
                            <Input label="이름" placeholder="홍길동" value={form.name} onChange={set("name")} />
                            <Input
                                label="이메일"
                                placeholder="name@studio.kr"
                                type="email"
                                value={form.email}
                                onChange={set("email")}
                            />
                        </div>
                        <div style={{ marginTop: "var(--sp-4)" }}>
                            <Input
                                label="회사 / 기관 (선택)"
                                placeholder="(주)스튜디오"
                                value={form.company}
                                onChange={set("company")}
                            />
                        </div>
                        <div style={{ marginTop: "var(--sp-4)" }}>
                            <div style={{ ...fieldLabelStyle, marginBottom: 8 }}>문의 내용</div>
                            <textarea
                                className="d4p-textarea"
                                rows={4}
                                placeholder="문의하실 내용을 입력해 주세요."
                                value={form.message}
                                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                            />
                        </div>
                        {error && (
                            <p
                                style={{
                                    fontFamily: "var(--font-sans)",
                                    fontSize: 13,
                                    color: "var(--ink-600)",
                                    margin: "var(--sp-3) 0 0",
                                }}
                            >
                                {error}
                            </p>
                        )}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 10,
                                marginTop: "var(--sp-5)",
                            }}
                        >
                            <Button variant="ghost" type="button" onClick={onClose}>
                                취소
                            </Button>
                            <Button variant="primary" type="submit" disabled={submitting}>
                                {submitting ? "보내는 중…" : "문의 보내기"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
