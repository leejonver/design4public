import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} | 공공조달 가구 납품사례`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    lang: "ko-KR",
    background_color: "#ffffff", // --paper
    theme_color: "#1b281a", // brand mark (public/symbol.svg fill #1B281A)
    icons: [
      { src: "/symbol.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
