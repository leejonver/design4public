import { describe, it, expect } from "vitest";
import {
  articleSchema,
  productSchema,
  brandSchema,
  imageObjectSchema,
  jsonLdGraph,
} from "@/lib/seo";

describe("JSON-LD schema helpers", () => {
  it("articleSchema: no bare @context, Article type, org author/publisher, ko-KR", () => {
    const node = articleSchema({
      headline: "강남 오피스",
      description: "설명",
      images: ["https://cdn/x.jpg?v=1"],
      datePublished: "2023-01-01T00:00:00Z",
      dateModified: "2024-02-02T00:00:00Z",
      path: "/projects/gangnam-office",
    });
    expect(node).not.toHaveProperty("@context");
    expect(node["@type"]).toBe("Article");
    expect(node.inLanguage).toBe("ko-KR");
    // cache-buster stripped
    expect(node.image).toEqual(["https://cdn/x.jpg"]);
    expect(node.mainEntityOfPage).toBe("https://www.design4public.com/projects/gangnam-office");
    expect((node.publisher as { "@id": string })["@id"]).toContain("#organization");
  });

  it("productSchema: Product type, brand, and NEVER offers/price", () => {
    const node = productSchema({
      name: "아에론 체어",
      description: "인체공학 체어",
      images: ["https://cdn/aeron.jpg"],
      brand: "허먼밀러",
      path: "/items/aeron-chair",
    });
    expect(node["@type"]).toBe("Product");
    expect(node).not.toHaveProperty("offers");
    expect(node).not.toHaveProperty("aggregateRating");
    expect((node.brand as { name: string }).name).toBe("허먼밀러");
  });

  it("productSchema: omits brand when null", () => {
    const node = productSchema({ name: "x", description: null, images: [], brand: null, path: "/items/x" });
    expect(node.brand).toBeUndefined();
    expect(node.image).toBeUndefined(); // empty → omitted
  });

  it("brandSchema: Brand type, alternateName + sameAs from website", () => {
    const node = brandSchema({
      name: "허먼밀러",
      nameEn: "Herman Miller",
      description: null,
      logo: null,
      website: "https://www.hermanmiller.com",
      path: "/brands/herman-miller",
    });
    expect(node["@type"]).toBe("Brand");
    expect(node.alternateName).toBe("Herman Miller");
    expect(node.sameAs).toEqual(["https://www.hermanmiller.com"]);
  });

  it("imageObjectSchema: contentUrl + representativeOfPage", () => {
    const node = imageObjectSchema({
      url: "https://cdn/x.jpg?token=1",
      caption: "회의실",
      description: null,
      representativeOfPage: true,
    });
    expect(node["@type"]).toBe("ImageObject");
    expect(node.contentUrl).toBe("https://cdn/x.jpg");
    expect(node.representativeOfPage).toBe(true);
  });

  it("jsonLdGraph wraps nodes with a single @context", () => {
    const g = jsonLdGraph([articleSchema({ headline: "h", description: null, images: [], datePublished: undefined, dateModified: undefined, path: "/projects/x" })]);
    expect(g["@context"]).toBe("https://schema.org");
    expect(Array.isArray(g["@graph"])).toBe(true);
  });
});
