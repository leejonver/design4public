// Escapes PostgREST-reserved characters before interpolating a user search term
// into an `.or(...)` filter string. PostgREST treats `,` as a clause separator
// and `()` as grouping; an unescaped term (e.g. a title with a comma) breaks out
// of the intended ilike value and 500s. Reserved chars are escaped with a
// backslash per PostgREST's documented rule.
function escapeTerm(term: string): string {
  return term.replace(/[\\,()]/g, (c) => `\\${c}`)
}

/** Build `col1.ilike.%term%,col2.ilike.%term%` with the term safely escaped. */
export function orIlike(cols: string[], term: string): string {
  const t = term.trim()
  if (!t) return ''
  const safe = escapeTerm(t)
  return cols.map((c) => `${c}.ilike.%${safe}%`).join(',')
}
