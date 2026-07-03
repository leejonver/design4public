import type { Metadata } from "next";
import { hybridSearch } from "@/lib/search/query";
import { SearchResults } from "./search-results";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEARCH",
  robots: { index: false, follow: true }, // search results pages are not indexable
};

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams?.q ?? "").trim();
  const groups = q
    ? await hybridSearch(q)
    : { project: [], item: [], brand: [], photo: [] };
  return <SearchResults query={q} groups={groups} />;
}
