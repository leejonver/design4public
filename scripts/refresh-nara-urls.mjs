// Re-point items.nara_url at the live 나라장터 record for each product.
//
// Why: a 나라장터 쇼핑몰 product link is keyed by 계약물품관리번호
// (`ctrtItemMngNo=<계약번호>_1<차수 2자리><품목순번 7자리>`). Every 변경계약 bumps
// the 차수 and marks the previous round's record "[계약해지상품]", so stored links
// rot on each amendment. The same 물품식별번호 lives on under the new 차수.
//
// For each item this probes the shop API for the current 차수 of the same
// 계약번호/품목순번 (same 물품식별번호 required), and rewrites nara_url to the canonical
// `https://shop.g2b.go.kr/link/GMSF001_01/?ctrtItemMngNo=...` form. Dry-run by
// default; `--apply` writes. Re-run whenever links start landing on 계약해지 pages.
//
// Usage:
//   DATABASE_URL=postgresql://... node scripts/refresh-nara-urls.mjs [--apply]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const API = 'https://shop.g2b.go.kr/gm/gms/gmsf/GdsDtlInfo/selectPdctBaseInfo.do'
const LINK = 'https://shop.g2b.go.kr/link/GMSF001_01/?ctrtItemMngNo='
const MAX_ROUND = 15

function fromEnvFile(key) {
  try {
    return readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${key}=`))
      ?.slice(key.length + 1)
      .replace(/^['"]|['"]$/g, '')
  } catch {
    return undefined
  }
}

async function lookup(no) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8', Accept: 'application/json' },
    body: JSON.stringify({ dlGdsDtlInfoSrchM: { srchCtrtItemMngNo: no } }),
  })
  const m = (await res.json()).dlPdctBaseInfoM ?? {}
  return {
    no: m.ctrtItemMngNo || null,
    idnf: m.itemIdnfNo || null,
    live: !!m.ctrtItemMngNo && !m.cncltnRmvSttsCd && m.useYn === 'Y' && m.dlngStpgYn !== 'Y',
  }
}

// Returns the live ctrtItemMngNo for the product `no` refers to, or null.
export async function resolveLive(no, fetchOne = lookup) {
  const current = await fetchOne(no)
  if (current.live) return no
  if (!current.no) return null
  const [contract, tail] = no.split('_')
  const seq = tail.slice(3)
  for (let r = 0; r <= MAX_ROUND; r++) {
    const cand = `${contract}_1${String(r).padStart(2, '0')}${seq}`
    if (cand === no) continue
    const x = await fetchOne(cand)
    if (x.live && x.idnf === current.idnf) return cand
  }
  return null
}

async function main() {
  const url = process.env.DATABASE_URL || fromEnvFile('DATABASE_URL')
  const apply = process.argv.includes('--apply')
  if (!url) {
    console.error('DATABASE_URL not set (env or .env.local)')
    process.exit(1)
  }
  const isLocal = url.includes('127.0.0.1') || url.includes('localhost')
  const client = new pg.Client({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } })
  await client.connect()
  try {
    const { rows } = await client.query(
      "select id, slug, nara_url from items where nara_url ~ '[0-9]{9}_[0-9]{10}' order by slug",
    )
    let changed = 0
    let unresolved = 0
    for (const row of rows) {
      const no = row.nara_url.match(/[0-9]{9}_[0-9]{10}/)[0]
      const live = await resolveLive(no)
      if (!live) {
        unresolved++
        console.log(`[unresolved] ${row.slug}: ${no} has no live 차수`)
        continue
      }
      const next = LINK + live
      if (next === row.nara_url) continue
      changed++
      console.log(`[${apply ? 'update' : 'dry-run'}] ${row.slug}: ${row.nara_url} -> ${next}`)
      if (apply) await client.query('update items set nara_url = $1 where id = $2', [next, row.id])
    }
    console.log(`${rows.length} items checked, ${changed} ${apply ? 'updated' : 'would change'}, ${unresolved} unresolved`)
  } finally {
    await client.end()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
