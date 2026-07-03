import { vi, type Mock } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
/**
 * lib/image-sync.ts - syncProjectPhotos 의 itemIds opt-in 동작 검증 (M4 Task 4).
 * itemIds 는 ref 단위 opt-in: 명시적으로 실은 ref 만 photo_items 를 (재)기록하고,
 * itemIds 를 아예 싣지 않은 레거시 ref 는 기존 photo_items 를 그대로 둔다.
 * M8: 헬퍼는 첫 인자로 RLS 스코프 Supabase 클라이언트를 받는다 — 여기서는 모의 db 를 주입한다.
 */
import { syncProjectPhotos } from '@/lib/image-sync'

type Call = { table: string; method: string; args: unknown[] }

// 체이너블 쿼리 빌더: 모든 호출을 calls 에 기록하고 항상 {data:null,error:null} 로 resolve 한다.
function makeChain(table: string, calls: Call[]): Record<string, unknown> {
  const methods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'order', 'range', 'limit', 'single', 'maybeSingle', 'in', 'not',
  ]
  const chain: Record<string, unknown> = {}
  methods.forEach((m) => {
    chain[m] = vi.fn((...args: unknown[]) => {
      calls.push({ table, method: m, args })
      return chain
    })
  })
  chain.then = (resolve: (r: { data: null; error: null }) => unknown) =>
    resolve({ data: null, error: null })
  return chain
}

const fromMock = vi.fn() as Mock
const db = { from: fromMock } as unknown as SupabaseClient<Database>

describe('syncProjectPhotos - itemIds opt-in (M4)', () => {
  let calls: Call[]

  beforeEach(() => {
    calls = []
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => makeChain(table, calls))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('itemIds 를 싣지 않은 ref 는 photo_items 를 건드리지 않는다 (레거시 호출자)', async () => {
    await syncProjectPhotos(db, 'p1', [{ photoId: 'ph1' }])

    expect(calls.some((c) => c.table === 'photo_items')).toBe(false)
  })

  it('itemIds 를 명시한 ref 는 photo_items 를 (재)기록한다', async () => {
    await syncProjectPhotos(db, 'p1', [{ photoId: 'ph1', itemIds: ['it1', 'it2'] }])

    const del = calls.find((c) => c.table === 'photo_items' && c.method === 'delete')
    expect(del).toBeDefined()
    const eqCall = calls.find((c) => c.table === 'photo_items' && c.method === 'eq')
    expect(eqCall?.args).toEqual(['photo_id', 'ph1'])

    const insert = calls.find((c) => c.table === 'photo_items' && c.method === 'insert')
    expect(insert?.args[0]).toEqual([
      { photo_id: 'ph1', item_id: 'it1', is_main: false, order: 0 },
      { photo_id: 'ph1', item_id: 'it2', is_main: false, order: 1 },
    ])
  })

  it('itemIds 로 빈 배열을 명시하면 photo_items 를 비운다 (삭제만, insert 없음)', async () => {
    await syncProjectPhotos(db, 'p1', [{ photoId: 'ph1', itemIds: [] }])

    expect(calls.some((c) => c.table === 'photo_items' && c.method === 'delete')).toBe(true)
    expect(calls.some((c) => c.table === 'photo_items' && c.method === 'insert')).toBe(false)
  })

  it('여러 ref 중 itemIds 를 실은 ref 만 photo_items 를 동기화한다', async () => {
    await syncProjectPhotos(db, 'p1', [
      { photoId: 'ph1', itemIds: ['it1'] },
      { photoId: 'ph2' },
    ])

    const photoItemsDeletes = calls.filter((c) => c.table === 'photo_items' && c.method === 'delete')
    expect(photoItemsDeletes).toHaveLength(1)
    const eqCalls = calls.filter((c) => c.table === 'photo_items' && c.method === 'eq')
    expect(eqCalls.map((c) => c.args)).toEqual([['photo_id', 'ph1']])
  })

  it('itemIds 유무와 무관하게 project_photos 행은 그대로 (재)기록된다', async () => {
    await syncProjectPhotos(db, 'p1', [{ photoId: 'ph1', itemIds: ['it1'] }])

    const upsert = calls.find((c) => c.table === 'project_photos' && c.method === 'upsert')
    expect(upsert?.args[0]).toEqual([{ project_id: 'p1', photo_id: 'ph1', is_main: true, order: 0 }])
  })
})
