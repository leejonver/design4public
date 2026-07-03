import { describe, it, expect } from 'vitest'
import { pairKey, missingDerived, perProjectProgress } from '../../../scripts/audit-relations.mjs'

const P = (project_id: string, item_id: string) => ({ project_id, item_id })

describe('pairKey', () => {
  it('joins project and item ids stably', () => {
    expect(pairKey(P('p1', 'i1'))).toBe('p1::i1')
  })
})

describe('missingDerived', () => {
  it('returns direct pairs with no derived counterpart', () => {
    const direct = [P('p1', 'i1'), P('p1', 'i2')]
    const derived = [P('p1', 'i1')]
    expect(missingDerived(direct, derived)).toEqual([P('p1', 'i2')])
  })

  it('returns [] when direct ⊆ derived (fully migrated)', () => {
    const direct = [P('p1', 'i1')]
    const derived = [P('p1', 'i1'), P('p2', 'i9')]
    expect(missingDerived(direct, derived)).toEqual([])
  })
})

describe('perProjectProgress', () => {
  it('counts covered vs missing direct pairs per project', () => {
    const direct = [P('p1', 'i1'), P('p1', 'i2'), P('p2', 'i3')]
    const derived = [P('p1', 'i1')]
    const rows = perProjectProgress(direct, derived).sort((a, b) => a.project_id.localeCompare(b.project_id))
    expect(rows).toEqual([
      { project_id: 'p1', total: 2, covered: 1, missing: 1 },
      { project_id: 'p2', total: 1, covered: 0, missing: 1 },
    ])
  })
})
