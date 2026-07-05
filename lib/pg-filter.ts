// PostgREST treats `,` `.` `:` `*` `(` `)` as reserved in an unquoted filter value —
// its unquoted-value grammar is "any char except , and )", with no escape support
// there. The documented way to pass such a value literally is to wrap it in double
// quotes; backslash only escapes a literal `"` or `\` *inside* that quoted value
// (https://docs.postgrest.org/en/latest/references/api/url_grammar.html). A term
// with a comma or paren left unquoted breaks out of the intended ilike value and 500s.
function escapeTerm(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** Build `col1.ilike."%term%",col2.ilike."%term%"` with the term safely quoted. */
export function orIlike(cols: string[], term: string): string {
  const t = term.trim()
  if (!t) return ''
  const safe = escapeTerm(t)
  return cols.map((c) => `${c}.ilike."%${safe}%"`).join(',')
}
