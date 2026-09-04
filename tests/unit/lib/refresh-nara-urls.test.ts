import { describe, it, expect } from 'vitest'
import { resolveLive } from '../../../scripts/refresh-nara-urls.mjs'

type Rec = { no: string | null; idnf: string | null; live: boolean }
const fake = (table: Record<string, Rec>) => async (no: string) =>
  table[no] ?? { no: null, idnf: null, live: false }

describe('resolveLive', () => {
  it('keeps a number that is still live', async () => {
    const f = fake({ '222231237_1040000048': { no: '222231237_1040000048', idnf: '24406265', live: true } })
    expect(await resolveLive('222231237_1040000048', f)).toBe('222231237_1040000048')
  })

  it('moves a 계약해지 number to the later 차수 with the same 물품식별번호', async () => {
    const f = fake({
      '222231237_1030000048': { no: '222231237_1030000048', idnf: '24406265', live: false },
      '222231237_1040000048': { no: '222231237_1040000048', idnf: '24406265', live: true },
    })
    expect(await resolveLive('222231237_1030000048', f)).toBe('222231237_1040000048')
  })

  it('rejects a live record whose 물품식별번호 differs', async () => {
    const f = fake({
      '222231237_1030000048': { no: '222231237_1030000048', idnf: '24406265', live: false },
      '222231237_1040000048': { no: '222231237_1040000048', idnf: '99999999', live: true },
    })
    expect(await resolveLive('222231237_1030000048', f)).toBeNull()
  })

  it('returns null for an unknown number', async () => {
    expect(await resolveLive('000000000_1000000001', fake({}))).toBeNull()
  })
})
