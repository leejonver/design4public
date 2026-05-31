import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const alt = SITE_NAME;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8faf7",
          color: "#1f2a24",
          padding: 72,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            letterSpacing: 0,
            color: "#5f7867",
          }}
        >
          공공조달 가구 납품사례
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 92, fontWeight: 700 }}>{SITE_NAME}</div>
          <div style={{ maxWidth: 860, fontSize: 34, lineHeight: 1.35 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div style={{ fontSize: 28, color: "#5f7867" }}>
          design4public.com
        </div>
      </div>
    ),
    size
  );
}
