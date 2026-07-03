// Union helpers for the project↔item transition (spec §7-1 stage 2).
// Related entities are the UNION of the legacy DIRECT links (project_items)
// and the DERIVED links (project → project_photos → photo_items → item),
// deduped by id. Direct rows are listed first (stable, preferred order);
// derived-only rows follow. Kept dependency-free so M6 search can reuse it.

export function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const r of rows) {
    if (r.id && !seen.has(r.id)) {
      seen.add(r.id)
      out.push(r)
    }
  }
  return out
}

export function unionById<T extends { id: string }>(direct: T[], derived: T[]): T[] {
  return dedupeById([...direct, ...derived])
}
