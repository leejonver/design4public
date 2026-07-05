import Image from "next/image";
import Link from "next/link";
import type { ProjectSummary, ItemSummary, BrandSummary } from "@/lib/types";

const CARD_FRAME_SIZES =
  "(max-width:560px) 100vw, (max-width:860px) 50vw, (max-width:1080px) 33vw, 25vw";

function CardFrame({
  ratio,
  src,
  alt,
  fallback,
  background,
  children,
}: {
  ratio: string;
  src: string | null;
  alt: string;
  fallback: string;
  background?: string;
  children?: React.ReactNode;
}) {
  const isWordmark = fallback.length > 3;
  return (
    <div
      className="d4p-card-frame"
      style={{ aspectRatio: ratio, ...(background ? { background } : {}) }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={CARD_FRAME_SIZES}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--sunken)",
            color: "var(--ink-400)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: isWordmark ? "1rem" : "1.8125rem",
            letterSpacing: isWordmark ? "0.08em" : "-0.01em",
            textTransform: isWordmark ? "uppercase" : "none",
            textAlign: "center",
            padding: "0 16px",
          }}
        >
          {fallback}
        </div>
      )}
      {children}
    </div>
  );
}

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const overline = [project.categories[0], project.year].filter(Boolean).join(" · ");
  return (
    <Link href={`/projects/${project.slug}`} className="d4p-card">
      <CardFrame
        ratio="3 / 2"
        src={project.coverImage}
        alt={project.title}
        fallback={project.title.charAt(0) || "DESIGN4PUBLIC"}
      />
      <div className="d4p-card-body">
        {overline && <div className="d4p-card-overline">{overline}</div>}
        <div className="d4p-card-title">{project.title}</div>
        {project.location && <div className="d4p-card-meta">{project.location}</div>}
      </div>
    </Link>
  );
}

export function ItemCard({ item }: { item: ItemSummary }) {
  const overline = item.brandName ?? item.brandNameEn;
  const meta = item.categories.join(" · ");
  return (
    <Link href={`/items/${item.slug}`} className="d4p-card">
      <CardFrame
        ratio="1 / 1"
        src={item.image}
        alt={item.name}
        fallback={item.name.charAt(0) || "DESIGN4PUBLIC"}
        background="var(--sunken)"
      />
      <div className="d4p-card-body">
        {overline && <div className="d4p-card-overline">{overline}</div>}
        <div className="d4p-card-title">{item.name}</div>
        {meta && <div className="d4p-card-meta">{meta}</div>}
      </div>
    </Link>
  );
}

export function BrandCard({ brand }: { brand: BrandSummary }) {
  const cover = brand.cover ?? brand.logo;
  return (
    <Link href={`/brands/${brand.slug}`} className="d4p-card">
      <CardFrame ratio="4 / 3" src={cover} alt={brand.nameKo} fallback={brand.nameKo}>
        {cover && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              background: "var(--scrim-bottom)",
              padding: "16px 18px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "1.5rem",
                lineHeight: 1.2,
                color: "#fff",
                letterSpacing: "-0.01em",
                wordBreak: "keep-all",
              }}
            >
              {brand.nameKo}
            </span>
          </div>
        )}
      </CardFrame>
    </Link>
  );
}
