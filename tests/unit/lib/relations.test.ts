import { describe, it, expect } from 'vitest'
import { dedupeById, unionById } from '@/lib/relations'

describe('dedupeById', () => {
  it('keeps first occurrence and drops later duplicates by id', () => {
    const rows = [{ id: 'a', n: 1 }, { id: 'b', n: 2 }, { id: 'a', n: 3 }]
    expect(dedupeById(rows)).toEqual([{ id: 'a', n: 1 }, { id: 'b', n: 2 }])
  })

  it('ignores rows with a falsy id', () => {
    expect(dedupeById([{ id: '', n: 1 }, { id: 'a', n: 2 }])).toEqual([{ id: 'a', n: 2 }])
  })
})

describe('unionById', () => {
  it('lists direct rows first, then derived-only rows, deduped', () => {
    const direct = [{ id: 'a' }, { id: 'b' }]
    const derived = [{ id: 'b' }, { id: 'c' }]
    expect(unionById(direct, derived).map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('returns direct unchanged when derived is empty (no regression)', () => {
    const direct = [{ id: 'a' }, { id: 'b' }]
    expect(unionById(direct, [])).toEqual(direct)
  })
})
