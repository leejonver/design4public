// Unified slug generation & collision handling. renewal_requirements.md §5-3.
// Used only for NEW entities — existing ids/slugs are never changed (§9-1).

export function slugify(input: string): string {
  const base = input
    .toString()
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'untitled'
}

/** Returns a unique slug by suffixing -1, -2, … until `exists` reports false. */
export async function uniqueSlug(
  source: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(source)
  let candidate = base
  let n = 1
  while (await exists(candidate)) {
    candidate = `${base}-${n}`
    n += 1
  }
  return candidate
}
