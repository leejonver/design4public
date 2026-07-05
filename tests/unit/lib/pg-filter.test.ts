import { describe, it, expect } from 'vitest'
import { orIlike } from '@/lib/pg-filter'

interface Condition {
  col: string
  op: string
  value: string
}

/**
 * Implements PostgREST's leaf-condition grammar for an `.or(...)` filter string:
 * `col.op.value(,col.op.value)*`, where `value` is either
 *   - a quoted value: `"` then chars where `\X` is an escape for any `X`, until an
 *     unescaped closing `"`
 *   - an unquoted value: any run of chars except `,` and `)`
 * (https://docs.postgrest.org/en/latest/references/api/url_grammar.html). Used to
 * verify the *parsed* result of orIlike's output, not just its raw string shape —
 * asserting on the string alone can't tell a correctly-quoted value from a value
 * that merely contains the right substrings.
 */
function parseOrConditions(filter: string): Condition[] {
  const conditions: Condition[] = []
  let i = 0
  while (i < filter.length) {
    const dot1 = filter.indexOf('.', i)
    const col = filter.slice(i, dot1)
    const dot2 = filter.indexOf('.', dot1 + 1)
    const op = filter.slice(dot1 + 1, dot2)
    i = dot2 + 1

    let value = ''
    if (filter[i] === '"') {
      i++
      while (i < filter.length && filter[i] !== '"') {
        if (filter[i] === '\\') {
          value += filter[i + 1]
          i += 2
        } else {
          value += filter[i]
          i++
        }
      }
      i++ // consume closing quote
    } else {
      const next = filter.indexOf(',', i)
      const end = next === -1 ? filter.length : next
      value = filter.slice(i, end)
      i = end
    }
    conditions.push({ col, op, value })
    if (filter[i] === ',') i++
  }
  return conditions
}

describe('orIlike', () => {
  it('builds an ilike or-clause across columns (raw output shape)', () => {
    expect(orIlike(['title', 'description'], 'chair')).toBe(
      'title.ilike."%chair%",description.ilike."%chair%"',
    )
  })

  it.each([
    ['comma and parens', 'a,b(c)'],
    ['embedded double quote', 'a"b'],
    ['embedded backslash', 'a\\b'],
    ['bare percent (ilike wildcard char)', '%'],
    ['non-ASCII', '가구 의자'],
  ])('parses correctly for an adversarial term: %s', (_label, term) => {
    const out = orIlike(['title', 'description'], term)
    const conditions = parseOrConditions(out)
    expect(conditions).toHaveLength(2)
    expect(conditions[0]).toEqual({ col: 'title', op: 'ilike', value: `%${term}%` })
    expect(conditions[1]).toEqual({ col: 'description', op: 'ilike', value: `%${term}%` })
  })

  it('trims and returns empty string for a blank term', () => {
    expect(orIlike(['title'], '   ')).toBe('')
  })
})
