import { describe, it, expect } from 'vitest'
import { parseListQuery } from '@/lib/list-query'

const sp = (o: Record<string, string>) => new URLSearchParams(o)

describe('parseListQuery', () => {
  const opts = { sortable: ['created_at', 'title'] as const, defaultSort: 'created_at' }
  it('applies defaults', () => {
    expect(parseListQuery(sp({}), opts)).toMatchObject({
      page: 1, limit: 20, offset: 0, sortCol: 'created_at', ascending: false,
    })
  })
  it('computes offset from page/limit', () => {
    expect(parseListQuery(sp({ page: '3', limit: '10' }), opts).offset).toBe(20)
  })
  it('rejects a non-allowlisted sort column, falling back to default', () => {
    expect(parseListQuery(sp({ sort: 'id; drop table' }), opts).sortCol).toBe('created_at')
  })
  it('honours dir=asc', () => {
    expect(parseListQuery(sp({ dir: 'asc' }), opts).ascending).toBe(true)
  })
  it('defaults ascending to a caller-supplied defaultAscending when dir is absent (categories route: default name-asc)', () => {
    expect(
      parseListQuery(sp({}), { ...opts, defaultAscending: true }).ascending,
    ).toBe(true)
    expect(
      parseListQuery(sp({ dir: 'desc' }), { ...opts, defaultAscending: true }).ascending,
    ).toBe(false)
  })
})
