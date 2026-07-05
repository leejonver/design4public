import { describe, it, expect } from 'vitest'
import { orIlike } from '@/lib/pg-filter'

describe('orIlike', () => {
  it('builds an ilike or-clause across columns', () => {
    expect(orIlike(['title', 'description'], 'chair')).toBe(
      'title.ilike.%chair%,description.ilike.%chair%',
    )
  })
  it('escapes PostgREST-reserved chars so a comma/paren cannot break out of the value', () => {
    // comma, parens and backslash must be escaped, not treated as clause separators
    const out = orIlike(['title'], 'a,b(c)')
    expect(out.startsWith('title.ilike.%')).toBe(true)
    expect(out).not.toMatch(/[^\\],ilike/) // no unescaped comma introduces a new clause
    expect(out).toContain('\\,')
    expect(out).toContain('\\(')
    expect(out).toContain('\\)')
  })
  it('trims and returns empty string for a blank term', () => {
    expect(orIlike(['title'], '   ')).toBe('')
  })
})
